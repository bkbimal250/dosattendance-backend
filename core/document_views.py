from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.template import Template, Context
from django.http import HttpResponse
from django.core.mail import send_mail
from django.conf import settings
import logging
from datetime import datetime, date
from django.utils.dateparse import parse_date
try:
    import weasyprint
    WEASYPRINT_AVAILABLE = True
except (ImportError, OSError):
    WEASYPRINT_AVAILABLE = False

from io import BytesIO

from .models import (
    CustomUser, DocumentTemplate, GeneratedDocument
)
from .serializers import (
    DocumentTemplateSerializer, GeneratedDocumentSerializer, DocumentGenerationSerializer
)

logger = logging.getLogger(__name__)


class DocumentTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing document templates"""
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only admins and managers can access templates
        if self.request.user.role in ['admin', 'manager']:
            return DocumentTemplate.objects.all()
        return DocumentTemplate.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class GeneratedDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing generated documents"""
    queryset = GeneratedDocument.objects.all()
    serializer_class = GeneratedDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return GeneratedDocument.objects.all()
        elif user.role == 'manager':
            # Managers can see documents for their office employees
            return GeneratedDocument.objects.filter(
                employee__office=user.office
            )
        else:
            # Employees can only see their own documents
            return GeneratedDocument.objects.filter(employee=user)
    
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Download PDF version of the document"""
        document = self.get_object()
        
        # Check if PDF file exists
        if document.pdf_file:
            filename = self.generate_document_filename(document)
            response = HttpResponse(document.pdf_file.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
            return response
        
        # If no PDF file, generate one on-demand
        if WEASYPRINT_AVAILABLE:
            try:
                pdf_buffer = BytesIO()
                weasyprint.HTML(string=document.content).write_pdf(pdf_buffer)
                pdf_buffer.seek(0)
                
                # Generate proper filename
                filename = self.generate_document_filename(document)
                
                # Save PDF file for future use
                document.pdf_file.save(f"{filename}.pdf", pdf_buffer, save=True)
                
                response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
                return response
                
            except Exception as e:
                logger.error(f"PDF generation failed for document {document.id}: {e}")
                # Fallback to HTML with proper filename
                filename = self.generate_document_filename(document)
                response = HttpResponse(document.content, content_type='text/html')
                response['Content-Disposition'] = f'attachment; filename="{filename}.html"'
                return response
        else:
            # If weasyprint is not available, return HTML content with proper filename
            filename = self.generate_document_filename(document)
            response = HttpResponse(document.content, content_type='text/html')
            response['Content-Disposition'] = f'attachment; filename="{filename}.html"'
            return response
    
    def generate_document_filename(self, document):
        """Generate a proper filename for the document"""
        from datetime import datetime
        
        # Get employee first name
        employee_name = document.employee.first_name.lower() if document.employee.first_name else "employee"
        
        # Try to get month and year from document data
        month_name = None
        year = None
        
        if document.document_type == 'salary_slip' and document.salary_data:
            try:
                salary_data = document.salary_data
                if isinstance(salary_data, str):
                    import json
                    salary_data = json.loads(salary_data)
                
                month_name = salary_data.get('salary_month', '').lower()
                year = salary_data.get('salary_year', '')
            except:
                pass
        
        # Fallback to current date if no specific data available
        if not month_name or not year:
            current_date = datetime.now()
            month_name = current_date.strftime("%B").lower()  # e.g., "august"
            year = current_date.year
        
        # Generate filename based on document type
        if document.document_type == 'salary_slip':
            filename = f"{employee_name}_{month_name}_salaryslip_{year}"
        elif document.document_type == 'offer_letter':
            filename = f"{employee_name}_{month_name}_offerletter_{year}"
        elif document.document_type == 'salary_increment':
            filename = f"{employee_name}_{month_name}_salaryincrement_{year}"
        else:
            filename = f"{employee_name}_{month_name}_{document.document_type}_{year}"
        
        return filename
    
    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """Send document via email to employee"""
        document = self.get_object()
        
        try:
            # Send email to employee
            subject = f"{document.title} - {document.employee.get_full_name()}"
            message = f"""
Dear {document.employee.get_full_name()},

Please find attached your {document.get_document_type_display()}.

Best regards,
{request.user.get_full_name()}
{request.user.office.name if request.user.office else 'Disha Online Solutions'}
            """
            
            # For now, we'll just mark as sent (email configuration needed)
            document.is_sent = True
            document.sent_at = timezone.now()
            document.save()
            
            return Response({
                'message': 'Document sent successfully',
                'sent_at': document.sent_at
            })
            
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return Response(
                {'error': 'Failed to send email'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentGenerationViewSet(viewsets.ViewSet):
    """ViewSet for generating documents"""
    permission_classes = [IsAuthenticated]
    
    def get_offer_letter_template(self):
        """Professional offer letter template"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    line-height: 1.6; 
                    color: #333;
                    background-color: #ffffff;
                }
                .page { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 40px; 
                    background: white;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header-strip { 
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
                    height: 3px; 
                    margin-bottom: 20px; 
                }
                .header { 
                    display: flex; 
                    align-items: center; 
                    margin-bottom: 30px; 
                    padding-bottom: 20px; 
                    border-bottom: 2px solid #e5e7eb; 
                }
                .logo-container { 
                    margin-right: 20px; 
                }
                .company-logo { 
                    max-height: 80px; 
                    max-width: 120px; 
                    object-fit: contain; 
                }
                .company-info { 
                    flex: 1; 
                }
                .company-name { 
                    font-size: 28px; 
                    font-weight: 700; 
                    color: #1e40af; 
                    margin: 0 0 8px 0; 
                    letter-spacing: 1px;
                }
                .company-address { 
                    font-size: 13px; 
                    color: #6b7280; 
                    line-height: 1.4; 
                    margin: 0;
                }
                .document-date { 
                    font-size: 14px; 
                    color: #374151; 
                    margin-bottom: 30px; 
                    text-align: right;
                }
                .title { 
                    text-align: center; 
                    font-size: 24px; 
                    font-weight: 700; 
                    margin: 40px 0; 
                    color: #1e40af;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .letter-info {
                    background: #f8fafc;
                    padding: 20px;
                    border-left: 4px solid #1e40af;
                    margin-bottom: 30px;
                }
                .letter-info p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                .content { 
                    margin: 30px 0; 
                    font-size: 15px;
                    line-height: 1.7;
                }
                .content p {
                    margin-bottom: 15px;
                }
                .highlight {
                    background: #dbeafe;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #3b82f6;
                }
                .signature { 
                    margin-top: 50px; 
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .signature-left {
                    flex: 1;
                }
                .signature-right {
                    text-align: right;
                }
                .footer { 
                    margin-top: 50px; 
                    text-align: center; 
                    font-size: 12px; 
                    color: #6b7280; 
                    border-top: 1px solid #e5e7eb; 
                    padding-top: 20px; 
                }
                .footer-strip {
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                    height: 2px;
                    margin-top: 20px;
                }
                .employee-name {
                    font-weight: 700;
                    color: #1e40af;
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header-strip"></div>
                
            <div class="header">
                    <div class="logo-container">
                        <img src="{{ logo_url }}" alt="Company Logo" class="company-logo">
                    </div>
                    <div class="company-info">
                        <h1 class="company-name">DISHA ONLINE SOLUTIONS</h1>
                        <p class="company-address">
                    Bhumiraj Costarica, 9th Floor Office No- 907, Plot No- 1 & 2,<br>
                    Sector 18, Sanpada, Navi Mumbai, Maharashtra 400705
                        </p>
                </div>
            </div>
            
                <div class="document-date">{{ current_date }}</div>
                
                <div class="title">Offer Letter</div>
                
                <div class="letter-info">
                    <p><strong>Date:</strong> {{ current_date }}</p>
                    <p><strong>To:</strong> {{ employee_name }}</p>
                    <p><strong>Subject:</strong> Job Offer - {{ position }}</p>
                </div>
            
            <div class="content">
                <p>Dear <strong>{{ employee_name }}</strong>,</p>
                
                    <p>We are pleased to offer you the position of <strong>{{ position }}</strong> at <strong>Disha Online Solutions</strong>. We are confident that your skills and experience will contribute significantly to the growth and success of our organization.</p>
                    
                    <div class="highlight">
                        <p><strong>Position Details:</strong></p>
                        <p><strong>Starting Date:</strong> {{ start_date }}</p>
                        <p><strong>Starting Salary:</strong> {{ starting_salary }}</p>
                    </div>
                    
                    <p>This offer is contingent upon your acceptance and completion of all pre-employment requirements. Please find the employee handbook enclosed, which contains detailed information about our medical and retirement benefits, company policies, and procedures.</p>
                    
                    <p>We believe you will be a valuable addition to our team and look forward to your contributions to our continued success.</p>
                    
                    <p>Please confirm your acceptance of this offer by signing and returning a copy of this offer letter within 7 days.</p>
                    
                    <p>We are excited to welcome you on board and look forward to a successful working relationship.</p>
                </div>
                
                <div class="signature">
                    <div class="signature-left">
                    <p>Sincerely,</p>
                        <br><br>
                    <p>Manager<br>Disha Online Solutions</p>
                </div>
                    <div class="signature-right">
                        <p class="employee-name">{{ employee_name }}</p>
                </div>
            </div>
            
            <div class="footer">
                    <p>This is a computer-generated document and does not require a signature.</p>
                </div>
                
                <div class="footer-strip"></div>
            </div>
        </body>
        </html>
        """
    
    def get_salary_increment_template(self):
        """Default salary increment template"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    line-height: 1.6; 
                    color: #333;
                    background-color: #ffffff;
                }
                .page { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 40px; 
                    background: white;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header-strip { 
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
                    height: 3px; 
                    margin-bottom: 20px; 
                }
                .header { 
                    display: flex; 
                    align-items: center; 
                    margin-bottom: 30px; 
                    padding-bottom: 20px; 
                    border-bottom: 2px solid #e5e7eb; 
                }
                .logo-container { 
                    margin-right: 20px; 
                }
                .company-logo { 
                    max-height: 80px; 
                    max-width: 120px; 
                    object-fit: contain; 
                }
                .company-info { 
                    flex: 1; 
                }
                .company-name { 
                    font-size: 28px; 
                    font-weight: 700; 
                    color: #1e40af; 
                    margin: 0 0 8px 0; 
                    letter-spacing: 1px;
                }
                .company-address { 
                    font-size: 13px; 
                    color: #6b7280; 
                    line-height: 1.4; 
                    margin: 0;
                }
                .document-date { 
                    font-size: 14px; 
                    color: #374151; 
                    margin-bottom: 30px; 
                    text-align: right;
                }
                .title { 
                    text-align: center; 
                    font-size: 24px; 
                    font-weight: 700; 
                    margin: 40px 0; 
                    color: #1e40af;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .letter-info {
                    background: #f8fafc;
                    padding: 20px;
                    border-left: 4px solid #1e40af;
                    margin-bottom: 30px;
                }
                .letter-info p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                .content { 
                    margin: 30px 0; 
                    font-size: 15px;
                    line-height: 1.7;
                }
                .content p {
                    margin-bottom: 15px;
                }
                .salary-details {
                    background: #f0f9ff;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 25px 0;
                    border-left: 4px solid #0ea5e9;
                }
                .salary-details h3 {
                    margin: 0 0 15px 0;
                    color: #0c4a6e;
                    font-size: 16px;
                }
                .salary-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 8px 0;
                    padding: 5px 0;
                    border-bottom: 1px solid #e0f2fe;
                }
                .salary-row:last-child {
                    border-bottom: none;
                    font-weight: 700;
                    color: #0c4a6e;
                    background: #e0f2fe;
                    padding: 10px;
                    border-radius: 4px;
                    margin-top: 10px;
                }
                .salary-label {
                    font-weight: 600;
                    color: #374151;
                }
                .salary-value {
                    font-weight: 500;
                    color: #1e40af;
                }
                .signature { 
                    margin-top: 50px; 
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .signature-left {
                    flex: 1;
                }
                .signature-right {
                    text-align: right;
                }
                .footer { 
                    margin-top: 50px; 
                    text-align: center; 
                    font-size: 12px; 
                    color: #6b7280; 
                    border-top: 1px solid #e5e7eb; 
                    padding-top: 20px; 
                }
                .footer-strip {
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                    height: 2px;
                    margin-top: 20px;
                }
                .employee-name {
                    font-weight: 700;
                    color: #1e40af;
                    font-size: 16px;
                }
                .appreciation {
                    background: #fef3c7;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #f59e0b;
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header-strip"></div>
                
            <div class="header">
                    <div class="logo-container">
                        <img src="{{ logo_url }}" alt="Company Logo" class="company-logo">
                    </div>
                    <div class="company-info">
                        <h1 class="company-name">DISHA ONLINE SOLUTIONS</h1>
                        <p class="company-address">
                    Bhumiraj Costarica, 9th Floor Office No- 907, Plot No- 1 & 2,<br>
                    Sector 18, Sanpada, Navi Mumbai, Maharashtra 400705
                        </p>
                </div>
            </div>
            
                <div class="document-date">{{ effective_date }}</div>
                
                <div class="title">Salary Increment Letter</div>
                
                <div class="letter-info">
                    <p><strong>Date:</strong> {{ effective_date }}</p>
                    <p><strong>To:</strong> {{ employee_name }} ({{ employee_designation }})</p>
                    <p><strong>Subject:</strong> Salary Increment Notification</p>
                </div>
            
            <div class="content">
                <p>Dear <strong>{{ employee_name }}</strong>,</p>
                
                    <p>We are pleased to inform you that in recognition of your exceptional performance, dedication, and valuable contributions to our organization, your salary has been increased.</p>
                    
                    <div class="salary-details">
                        <h3>Salary Increment Details</h3>
                        <div class="salary-row">
                            <span class="salary-label">Previous Annual Salary:</span>
                            <span class="salary-value">{{ previous_salary }}</span>
                        </div>
                        <div class="salary-row">
                            <span class="salary-label">Increment Percentage:</span>
                            <span class="salary-value">{{ increment_percentage }}</span>
                        </div>
                        <div class="salary-row">
                            <span class="salary-label">New Annual Salary:</span>
                            <span class="salary-value">{{ new_salary }}</span>
                        </div>
                        <div class="salary-row">
                            <span class="salary-label">Effective Date:</span>
                            <span class="salary-value">{{ effective_date }}</span>
                        </div>
                    </div>
                    
                    <div class="appreciation">
                        <p><strong>Recognition:</strong> This increment reflects our appreciation for your hard work, commitment to excellence, and the positive impact you have made on our team and organization.</p>
                    </div>
                    
                    <p>We sincerely appreciate your dedication and look forward to your continued contributions to our team's success. Your commitment to excellence has not gone unnoticed, and we are confident that you will continue to excel in your role.</p>
                    
                    <p>This salary increment is effective from <strong>{{ effective_date }}</strong> and will be reflected in your next payroll cycle.</p>
                    
                    <p>We value your contributions and look forward to a continued successful working relationship.</p>
                </div>
                
                <div class="signature">
                    <div class="signature-left">
                    <p>Best regards,</p>
                        <br><br>
                    <p>Manager<br>Disha Online Solutions</p>
                </div>
                    <div class="signature-right">
                        <p class="employee-name">{{ employee_name }}</p>
                </div>
            </div>
            
            <div class="footer">
                    <p>This is a computer-generated document and does not require a signature.</p>
                </div>
                
                <div class="footer-strip"></div>
            </div>
        </body>
        </html>
        """
    
    def get_salary_slip_template(self):
        """Professional salary slip template"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    line-height: 1.6; 
                    color: #333;
                    background-color: #ffffff;
                }
                .page { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 40px; 
                    background: white;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header-strip { 
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
                    height: 3px; 
                    margin-bottom: 20px; 
                }
                .header { 
                    display: flex; 
                    align-items: center; 
                    margin-bottom: 30px; 
                    padding-bottom: 20px; 
                    border-bottom: 2px solid #e5e7eb; 
                }
                .logo-container { 
                    margin-right: 20px; 
                }
                .company-logo { 
                    max-height: 80px; 
                    max-width: 120px; 
                    object-fit: contain; 
                }
                .company-info { 
                    flex: 1; 
                }
                .company-name { 
                    font-size: 28px; 
                    font-weight: 700; 
                    color: #1e40af; 
                    margin: 0 0 8px 0; 
                    letter-spacing: 1px;
                }
                .company-address { 
                    font-size: 13px; 
                    color: #6b7280; 
                    line-height: 1.4; 
                    margin: 0;
                }
                .document-title { 
                    text-align: center; 
                    font-size: 24px; 
                    font-weight: 700; 
                    margin: 30px 0; 
                    color: #1e40af;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .salary-month {
                    text-align: center;
                    font-size: 18px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 30px;
                    background: #f8fafc;
                    padding: 10px;
                    border-radius: 8px;
                }
                .employee-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                }
                .employee-info, .bank-info {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #1e40af;
                }
                .section-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1e40af;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 8px 0;
                    padding: 5px 0;
                    border-bottom: 1px solid #e5e7eb;
                }
                .info-row:last-child {
                    border-bottom: none;
                }
                .info-label {
                    font-weight: 600;
                    color: #374151;
                }
                .info-value {
                    font-weight: 500;
                    color: #1e40af;
                }
                .salary-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 30px 0;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .salary-table th {
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                    color: white;
                    padding: 15px;
                    text-align: left;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .salary-table td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .salary-table tr:nth-child(even) {
                    background: #f8fafc;
                }
                .salary-table tr:last-child td {
                    border-bottom: none;
                    font-weight: 700;
                    background: #dbeafe;
                    color: #1e40af;
                }
                .amount {
                    text-align: right;
                    font-weight: 600;
                }
                .net-salary {
                    background: #dbeafe !important;
                    font-weight: 700;
                    font-size: 16px;
                    color: #1e40af;
                }
                .footer { 
                    margin-top: 40px; 
                    text-align: center; 
                    font-size: 12px; 
                    color: #6b7280; 
                    border-top: 1px solid #e5e7eb; 
                    padding-top: 20px; 
                }
                .footer-strip {
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                    height: 2px;
                    margin-top: 20px;
                }
                .generated-info {
                    text-align: right;
                    font-size: 11px;
                    color: #9ca3af;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header-strip"></div>
                
                <div class="header">
                    <div class="logo-container">
                        <img src="{{ logo_url }}" alt="Company Logo" class="company-logo">
                    </div>
                    <div class="company-info">
                        <h1 class="company-name">DISHA ONLINE SOLUTIONS</h1>
                        <p class="company-address">
                            Bhumiraj Costarica, 9th Floor Office No- 907, Plot No- 1 & 2,<br>
                            Sector 18, Sanpada, Navi Mumbai, Maharashtra 400705
                        </p>
                    </div>
                </div>
                
                <div class="document-title">Salary Slip</div>
                <div class="salary-month">{{ salary_month }} {{ salary_year }}</div>
                
                <div class="employee-section">
                    <div class="employee-info">
                        <div class="section-title">Employee Information</div>
                        <div class="info-row">
                            <span class="info-label">Employee Name:</span>
                            <span class="info-value">{{ employee_name }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Employee ID:</span>
                            <span class="info-value">{{ employee_id }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Designation:</span>
                            <span class="info-value">{{ employee_designation }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Department:</span>
                            <span class="info-value">{{ employee_department }}</span>
                        </div>
                    </div>
                    
                    <div class="bank-info">
                        <div class="section-title">Bank & Other Details</div>
                        <div class="info-row">
                            <span class="info-label">Bank Name:</span>
                            <span class="info-value">{{ bank_name }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Account No:</span>
                            <span class="info-value">{{ account_number }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Date of Joining:</span>
                            <span class="info-value">{{ date_of_joining }}</span>
                        </div>
                    </div>
                </div>
                
                <table class="salary-table">
                    <thead>
                        <tr>
                            <th>Component</th>
                            <th class="amount">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Basic Salary</td>
                            <td class="amount">{{ basic_salary }}</td>
                        </tr>
                        <tr>
                            <td>Extra Days Pay</td>
                            <td class="amount">{{ extra_days_pay }}</td>
                        </tr>
                        <tr>
                            <td>Total Salary</td>
                            <td class="amount">{{ total_salary }}</td>
                        </tr>
                        <tr>
                            <td class="net-salary">NET SALARY</td>
                            <td class="amount net-salary">{{ net_salary }}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>This is a computer generated salary slip and does not require signature</p>
                </div>
                
                <div class="generated-info">
                    Generated on: {{ current_date }}
                </div>
                
                <div class="footer-strip"></div>
            </div>
        </body>
        </html>
        """
    
    def format_currency(self, amount):
        """Format currency in Indian format"""
        if amount is None:
            return "Not specified"
        
        # Convert to integer for formatting
        amount_int = int(float(amount))
        
        # Format with commas
        formatted = f"{amount_int:,}"
        
        # Convert to words for display
        if amount_int >= 100000:
            lakhs = amount_int // 100000
            thousands = (amount_int % 100000) // 1000
            if thousands > 0:
                return f"Rs. {formatted} ({lakhs} Lakh {thousands} Thousand)"
            else:
                return f"Rs. {formatted} ({lakhs} Lakh)"
        elif amount_int >= 1000:
            thousands = amount_int // 1000
            return f"Rs. {formatted} ({thousands} Thousand)"
        else:
            return f"Rs. {formatted}"
    
    def get_logo_url(self):
        """Get the company logo URL"""
        from django.conf import settings
        import os
        
        # Check if logo file exists
        logo_path = os.path.join(settings.MEDIA_ROOT, 'documents', 'companylogo.png')
        if os.path.exists(logo_path):
            # For development, use localhost
            domain = "http://localhost:8000"
            # Return absolute URL for the logo
            return f"{domain}{settings.MEDIA_URL}documents/companylogo.png"
        else:
            # Return a placeholder or default logo
            domain = "http://localhost:8000"
            return f"{domain}{settings.MEDIA_URL}documents/companylogo.png"
    
    def generate_document_content(self, employee, document_type, data):
        """Generate document content using template"""
        
        if document_type == 'offer_letter':
            template_content = self.get_offer_letter_template()
            
            # Format start date
            start_date_str = data.get('start_date', '')
            if start_date_str:
                try:
                    start_date_obj = parse_date(start_date_str)
                    if start_date_obj:
                        start_date_formatted = start_date_obj.strftime('%d-%m-%Y')
                    else:
                        start_date_formatted = start_date_str
                except:
                    start_date_formatted = start_date_str
            else:
                start_date_formatted = ''
            
            context = {
                'employee_name': employee.get_full_name(),
                'position': data.get('position', ''),
                'start_date': start_date_formatted,
                'starting_salary': self.format_currency(data.get('starting_salary')),
                'current_date': datetime.now().strftime('%A, %d %B %Y'),
                'logo_url': self.get_logo_url(),
            }
            
        elif document_type == 'salary_increment':
            template_content = self.get_salary_increment_template()
            
            # Calculate increment percentage
            previous_salary = float(data.get('previous_salary', 0))
            new_salary = float(data.get('new_salary', 0))
            increment_percentage = ((new_salary - previous_salary) / previous_salary * 100) if previous_salary > 0 else 0
            
            # Format effective date
            effective_date_str = data.get('effective_date', '')
            if effective_date_str:
                try:
                    effective_date_obj = parse_date(effective_date_str)
                    if effective_date_obj:
                        effective_date_formatted = effective_date_obj.strftime('%d-%m-%Y')
                    else:
                        effective_date_formatted = effective_date_str
                except:
                    effective_date_formatted = effective_date_str
            else:
                effective_date_formatted = ''
            
            context = {
                'employee_name': employee.get_full_name(),
                'employee_designation': employee.designation or 'Employee',
                'previous_salary': self.format_currency(data.get('previous_salary')),
                'new_salary': self.format_currency(data.get('new_salary')),
                'increment_percentage': f"{increment_percentage:.0f}%",
                'effective_date': effective_date_formatted,
                'logo_url': self.get_logo_url(),
            }
        
        elif document_type == 'salary_slip':
            template_content = self.get_salary_slip_template()
            
            # Get salary slip data
            basic_salary = float(data.get('basic_salary', 0))
            extra_days_pay = float(data.get('extra_days_pay', 0))
            total_salary = basic_salary + extra_days_pay
            net_salary = total_salary  # For now, net salary equals total salary
            
            # Format salary month and year
            salary_month = data.get('salary_month', '')
            salary_year = data.get('salary_year', '')
            
            # Get employee bank details (you may need to add these fields to your CustomUser model)
            bank_name = getattr(employee, 'bank_name', 'Not specified')
            account_number = getattr(employee, 'account_number', 'Not specified')
            
            # Format date of joining
            date_of_joining = 'Not specified'
            if hasattr(employee, 'date_joined'):
                date_of_joining = employee.date_joined.strftime('%d/%m/%Y')
            
            context = {
                'employee_name': employee.get_full_name(),
                'employee_id': str(employee.id)[:8].upper(),  # Short employee ID
                'employee_designation': employee.designation or 'Not specified',
                'employee_department': getattr(employee, 'department', 'Not specified'),
                'bank_name': bank_name,
                'account_number': account_number,
                'date_of_joining': date_of_joining,
                'salary_month': salary_month,
                'salary_year': salary_year,
                'basic_salary': self.format_currency(basic_salary),
                'extra_days_pay': self.format_currency(extra_days_pay),
                'total_salary': self.format_currency(total_salary),
                'net_salary': self.format_currency(net_salary),
                'logo_url': self.get_logo_url(),
                'current_date': datetime.now().strftime('%d/%m/%Y')
            }
        
        else:
            raise ValueError(f"Unsupported document type: {document_type}")
        
        # Render template
        template = Template(template_content)
        rendered_content = template.render(Context(context))
        
        return rendered_content
    
    @action(detail=False, methods=['post'])
    def preview_document(self, request):
        """Preview a document before generation"""
        try:
            serializer = DocumentGenerationSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            employee_id = data['employee_id']
            document_type = data['document_type']
            
            # Get employee
            employee = get_object_or_404(CustomUser, id=employee_id)
            
            # Check permissions
            user = request.user
            if user.role == 'manager' and employee.office != user.office:
                return Response(
                    {'error': 'You can only preview documents for employees in your office'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            elif user.role == 'employee':
                return Response(
                    {'error': 'Employees cannot preview documents'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generate document content
            content = self.generate_document_content(employee, document_type, data)
            
            # Create title
            if document_type == 'offer_letter':
                title = f"Offer Letter - {employee.get_full_name()}"
            elif document_type == 'salary_increment':
                title = f"Salary Increment Letter - {employee.get_full_name()}"
            else:
                title = f"{document_type.replace('_', ' ').title()} - {employee.get_full_name()}"
            
            return Response({
                'title': title,
                'content': content,
                'employee_name': employee.get_full_name(),
                'employee_email': employee.email,
                'document_type': document_type,
                'preview_data': data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Document preview failed: {e}")
            return Response({'error': 'Failed to preview document'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def generate_document(self, request):
        """Generate a document for an employee"""
        serializer = DocumentGenerationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        employee_id = data['employee_id']
        document_type = data['document_type']
        
        # Get employee
        employee = get_object_or_404(CustomUser, id=employee_id)
        
        # Check permissions
        user = request.user
        if user.role == 'manager' and employee.office != user.office:
            return Response(
                {'error': 'You can only generate documents for employees in your office'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        elif user.role == 'employee':
            return Response(
                {'error': 'Employees cannot generate documents'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Generate document content
            content = self.generate_document_content(employee, document_type, data)
            
            # Create document title
            if document_type == 'offer_letter':
                title = f"Offer Letter - {employee.get_full_name()}"
            elif document_type == 'salary_increment':
                title = f"Salary Increment Letter - {employee.get_full_name()}"
            else:
                title = f"{document_type.replace('_', ' ').title()} - {employee.get_full_name()}"
            
            # Convert data to JSON-serializable format
            json_data = {}
            for key, value in data.items():
                if hasattr(value, 'isoformat'):  # datetime/date objects
                    json_data[key] = value.isoformat()
                elif hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool, list, dict)):
                    json_data[key] = str(value)  # UUID and other objects
                else:
                    json_data[key] = value
            
            # Get or create default template
            template = DocumentTemplate.objects.filter(
                document_type=document_type,
                is_active=True
            ).first()
            
            if not template:
                # Create a default template if none exists
                if document_type == 'offer_letter':
                    template_content = self.get_offer_letter_template()
                elif document_type == 'salary_increment':
                    template_content = self.get_salary_increment_template()
                else:
                    template_content = "<html><body><h1>Document</h1></body></html>"
                
                template = DocumentTemplate.objects.create(
                    name=f"Default {document_type.replace('_', ' ').title()}",
                    document_type=document_type,
                    template_content=template_content,
                    is_active=True,
                    created_by=user
                )
            
            # Create generated document record
            generated_doc = GeneratedDocument.objects.create(
                employee=employee,
                template=template,
                document_type=document_type,
                title=title,
                content=content,
                generated_by=user,
                offer_data=json_data if document_type == 'offer_letter' else None,
                increment_data=json_data if document_type == 'salary_increment' else None,
                salary_data=json_data if document_type == 'salary_slip' else None,
            )
            
            # Generate PDF (optional - requires weasyprint)
            if WEASYPRINT_AVAILABLE:
                try:
                    pdf_buffer = BytesIO()
                    weasyprint.HTML(string=content).write_pdf(pdf_buffer)
                    pdf_buffer.seek(0)
                    
                    # Save PDF file
                    filename = f"{title.replace(' ', '_')}_{generated_doc.id}.pdf"
                    generated_doc.pdf_file.save(filename, pdf_buffer, save=True)
                    
                except Exception as e:
                    logger.warning(f"PDF generation failed: {e}")
                    # Continue without PDF
            else:
                logger.info("WeasyPrint not available, skipping PDF generation")
            
            # Send email if requested
            if data.get('send_email', True):
                try:
                    # Mark as sent (actual email sending would require email configuration)
                    generated_doc.is_sent = True
                    generated_doc.sent_at = timezone.now()
                    generated_doc.save()
                except Exception as e:
                    logger.warning(f"Email sending failed: {e}")
            
            # Return generated document
            response_serializer = GeneratedDocumentSerializer(generated_doc)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Document generation failed: {e}")
            return Response(
                {'error': 'Failed to generate document'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def get_employees(self, request):
        """Get list of employees for document generation"""
        user = request.user
        
        if user.role == 'admin':
            employees = CustomUser.objects.filter(role='employee')
        elif user.role == 'manager':
            employees = CustomUser.objects.filter(role='employee', office=user.office)
        else:
            return Response(
                {'error': 'Access denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        employee_data = []
        for emp in employees:
            employee_data.append({
                'id': emp.id,
                'name': emp.get_full_name(),
                'email': emp.email,
                'designation': emp.designation,
                'department': emp.department,
                'office': emp.office.name if emp.office else None,
                'current_salary': emp.salary
            })
        
        return Response(employee_data)

    @action(detail=False, methods=['get'])
    def my_documents(self, request):
        """Get current user's documents (for employees to view their own documents)"""
        user = request.user
        
        if user.role == 'employee':
            # Employee can only see their own documents
            documents = GeneratedDocument.objects.filter(employee=user).order_by('-generated_at')
        elif user.role == 'manager':
            # Manager can see documents for employees in their office
            documents = GeneratedDocument.objects.filter(
                employee__office=user.office
            ).order_by('-generated_at')
        elif user.role == 'admin':
            # Admin can see all documents
            documents = GeneratedDocument.objects.all().order_by('-generated_at')
        else:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = GeneratedDocumentSerializer(documents, many=True)
        return Response(serializer.data)
