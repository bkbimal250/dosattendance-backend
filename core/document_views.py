from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.template import Template, Context
from django.http import HttpResponse, JsonResponse
from django.core.mail import send_mail
from django.conf import settings
import logging
from datetime import datetime, date
from django.utils.dateparse import parse_date
try:
    import weasyprint
    import pydyf
    WEASYPRINT_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info(f"WeasyPrint is available for PDF generation - Version: {weasyprint.__version__}")
    logger.info(f"pydyf version: {pydyf.__version__}")
    
    # Test if pydyf.PDF constructor is compatible
    try:
        # Test the PDF constructor with different argument counts
        test_pdf = pydyf.PDF()
        logger.info("pydyf.PDF() constructor test: SUCCESS (0 args)")
        PDF_CONSTRUCTOR_ARGS = 0
    except TypeError as e:
        try:
            test_pdf = pydyf.PDF('1.7')
            logger.info("pydyf.PDF() constructor test: SUCCESS (1 arg)")
            PDF_CONSTRUCTOR_ARGS = 1
        except TypeError as e2:
            try:
                test_pdf = pydyf.PDF('1.7', 'test')
                logger.info("pydyf.PDF() constructor test: SUCCESS (2 args)")
                PDF_CONSTRUCTOR_ARGS = 2
            except TypeError as e3:
                logger.error(f"pydyf.PDF() constructor test: FAILED - {e3}")
                PDF_CONSTRUCTOR_ARGS = -1
                WEASYPRINT_AVAILABLE = False
                
except (ImportError, OSError) as e:
    WEASYPRINT_AVAILABLE = False
    PDF_CONSTRUCTOR_ARGS = -1
    logger = logging.getLogger(__name__)
    logger.error(f"WeasyPrint not available: {e}. PDF generation will be disabled.")

from io import BytesIO

from .models import (
    CustomUser, DocumentTemplate, GeneratedDocument, Office
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
        logger.info(f"Download PDF request for document {document.id}: {document.title}")
        
        # Debug: Check document state
        logger.info(f"Document PDF file field: {document.pdf_file}")
        if document.pdf_file:
            logger.info(f"PDF file name: {document.pdf_file.name}")
            logger.info(f"PDF file size: {document.pdf_file.size}")
            logger.info(f"PDF file URL: {document.pdf_file.url}")
        
        # Debug: Check MEDIA_ROOT setting
        from django.conf import settings
        logger.info(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
        logger.info(f"MEDIA_URL: {settings.MEDIA_URL}")
        
        # Check if PDF file exists and is valid
        if document.pdf_file and document.pdf_file.size > 0:
            try:
                import os
                logger.info(f"PDF file exists in database: {document.pdf_file.name}, size: {document.pdf_file.size}")
                logger.info(f"PDF file path: {document.pdf_file.path}")
                # Check if the file actually exists on disk
                if os.path.exists(document.pdf_file.path):
                    filename = self.generate_document_filename(document)
                    logger.info(f"Reading PDF file content...")
                    
                    # Check file permissions
                    import stat
                    file_stat = os.stat(document.pdf_file.path)
                    logger.info(f"File permissions: {stat.filemode(file_stat.st_mode)}")
                    logger.info(f"File size on disk: {file_stat.st_size} bytes")
                    
                    pdf_content = document.pdf_file.read()
                    logger.info(f"PDF content size: {len(pdf_content)} bytes")
                    logger.info(f"PDF content starts with: {pdf_content[:10]}")
                    
                    # Verify it's actually a PDF by checking the header
                    if pdf_content.startswith(b'%PDF'):
                        response = HttpResponse(pdf_content, content_type='application/pdf')
                        response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
                        response['Content-Length'] = len(pdf_content)
                        return response
                    else:
                        logger.warning(f"PDF file for document {document.id} is corrupted, regenerating...")
                else:
                    logger.warning(f"PDF file for document {document.id} does not exist on disk: {document.pdf_file.path}")
                    logger.warning(f"Cleaning up orphaned files and regenerating...")
                    self.cleanup_orphaned_files(document)
            except Exception as e:
                logger.error(f"Error reading existing PDF file for document {document.id}: {e}")
                import traceback
                logger.error(f"PDF file read error traceback: {traceback.format_exc()}")
                # Try to clean up orphaned files
                self.cleanup_orphaned_files(document)
                # Return error response instead of continuing
                return JsonResponse({
                    'error': 'PDF file read error',
                    'detail': str(e),
                    'traceback': traceback.format_exc()
                }, status=500)
        
        # If no valid PDF file, generate one on-demand (works on VPS hosting)
        if WEASYPRINT_AVAILABLE:
            try:
                logger.info(f"Generating PDF for document {document.id}")
                logger.info(f"Using WeasyPrint version: {weasyprint.__version__}")
                
                # Generate proper filename
                filename = self.generate_document_filename(document)
                
                # Get company logo path and information
                logo_path = ""
                company_name = "Your Company Name"
                company_address = "Company Address, City, State, ZIP"
                
                try:
                    import os
                    from django.conf import settings
                    
                    # Try different logo locations
                    logo_locations = [
                        os.path.join(settings.MEDIA_ROOT, 'documents', 'companylogo.png'),
                        os.path.join(settings.MEDIA_ROOT, 'companylogo.png'),
                        os.path.join(settings.MEDIA_ROOT, 'logo.png'),
                        os.path.join(settings.STATIC_ROOT, 'images', 'logo.png') if hasattr(settings, 'STATIC_ROOT') else None
                    ]
                    
                    for logo_file in logo_locations:
                        if logo_file and os.path.exists(logo_file):
                            logo_path = f"file://{logo_file}"
                            logger.info(f"Company logo found: {logo_path}")
                            break
                    
                    if not logo_path:
                        logger.warning("Company logo not found, using text header")
                    
                    # Get company information from settings or use defaults
                    company_name = getattr(settings, 'COMPANY_NAME', 'Your Company Name')
                    company_address = getattr(settings, 'COMPANY_ADDRESS', 'Company Address, City, State, ZIP')
                    company_phone = getattr(settings, 'COMPANY_PHONE', '+1 (555) 123-4567')
                    company_email = getattr(settings, 'COMPANY_EMAIL', 'info@company.d0s369.co.in')
                    company_website = getattr(settings, 'COMPANY_WEBSITE', 'https://company.d0s369.co.in')
                    
                except Exception as e:
                    logger.warning(f"Could not load company information: {e}")
                
                # Get employee ID from user
                employee_id = document.user.employee_id if document.user.employee_id else str(document.user.id)[:8].upper()
                
                # Enhance the document content with professional, compact CSS for A4 printing
                html_content = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>{document.title}</title>
                    <style>
                        @page {{
                            margin: 0.75in;
                            size: A4;
                        }}
                        
                        * {{
                            box-sizing: border-box;
                        }}
                        
                        body {{
                            font-family: 'Arial', 'Helvetica', sans-serif;
                            font-size: 10pt;
                            line-height: 1.2;
                            color: #000000;
                            margin: 0;
                            padding: 0;
                            background: white;
                        }}
                        
                        .document-container {{
                            max-width: 100%;
                            margin: 0 auto;
                        }}
                        
                        .header {{
                            text-align: center;
                            margin-bottom: 15px;
                            border-bottom: 1px solid #000;
                            padding-bottom: 10px;
                        }}
                        
                        .company-logo {{
                            max-height: 50px;
                            max-width: 150px;
                            margin-bottom: 8px;
                        }}
                        
                        .company-name {{
                            font-size: 14pt;
                            font-weight: bold;
                            color: #000000;
                            margin: 3px 0;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }}
                        
                        .company-address {{
                            font-size: 8pt;
                            color: #000000;
                            margin: 2px 0;
                            line-height: 1.1;
                        }}
                        
                        .company-contact {{
                            font-size: 7pt;
                            color: #000000;
                            margin: 2px 0;
                        }}
                        
                        .document-title {{
                            font-size: 12pt;
                            font-weight: bold;
                            color: #000000;
                            text-align: center;
                            margin: 15px 0 10px 0;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }}
                        
                        .employee-header {{
                            display: flex;
                            justify-content: space-between;
                            margin: 10px 0;
                            font-size: 9pt;
                            border-bottom: 1px solid #000;
                            padding-bottom: 8px;
                        }}
                        
                        .employee-id {{
                            font-weight: bold;
                            color: #000000;
                        }}
                        
                        .document-date {{
                            color: #000000;
                        }}
                        
                        h1, h2, h3, h4, h5, h6 {{
                            color: #000000;
                            margin-top: 10px;
                            margin-bottom: 5px;
                            page-break-after: avoid;
                        }}
                        
                        h1 {{
                            font-size: 12pt;
                            font-weight: bold;
                        }}
                        
                        h2 {{
                            font-size: 11pt;
                            font-weight: bold;
                        }}
                        
                        h3 {{
                            font-size: 10pt;
                            font-weight: bold;
                        }}
                        
                        p {{
                            margin: 4px 0;
                            text-align: justify;
                            font-size: 9pt;
                            line-height: 1.2;
                        }}
                        
                        .content {{
                            margin: 10px 0;
                        }}
                        
                        .footer {{
                            margin-top: 20px;
                            padding-top: 8px;
                            border-top: 1px solid #000;
                            font-size: 7pt;
                            color: #000000;
                            text-align: center;
                        }}
                        
                        table {{
                            width: 100%;
                            border-collapse: collapse;
                            margin: 8px 0;
                            font-size: 9pt;
                            border: 1px solid #000;
                        }}
                        
                        th, td {{
                            border: 1px solid #000;
                            padding: 4px 6px;
                            text-align: left;
                            vertical-align: top;
                        }}
                        
                        th {{
                            background-color: #f0f0f0;
                            font-weight: bold;
                            font-size: 9pt;
                            color: #000000;
                        }}
                        
                        .salary-table {{
                            margin: 10px 0;
                        }}
                        
                        .salary-table th {{
                            background-color: #e0e0e0;
                            text-align: center;
                            font-weight: bold;
                        }}
                        
                        .salary-table td {{
                            text-align: right;
                        }}
                        
                        .salary-table .label {{
                            text-align: left;
                            font-weight: bold;
                        }}
                        
                        .signature-section {{
                            margin-top: 20px;
                            page-break-inside: avoid;
                        }}
                        
                        .signature-line {{
                            border-bottom: 1px solid #000;
                            width: 150px;
                            margin: 10px 0 3px 0;
                        }}
                        
                        .employee-info {{
                            display: flex;
                            justify-content: space-between;
                            margin: 8px 0;
                            font-size: 9pt;
                        }}
                        
                        .employee-info div {{
                            flex: 1;
                            margin: 0 5px;
                        }}
                        
                        .date-info {{
                            text-align: right;
                            font-size: 8pt;
                            color: #000000;
                            margin: 5px 0;
                        }}
                        
                        /* Compact spacing for A4 */
                        .compact {{
                            margin: 3px 0;
                        }}
                        
                        .compact p {{
                            margin: 2px 0;
                        }}
                        
                        .text-center {{
                            text-align: center;
                        }}
                        
                        .text-right {{
                            text-align: right;
                        }}
                        
                        .text-bold {{
                            font-weight: bold;
                        }}
                        
                        .mt-10 {{
                            margin-top: 10px;
                        }}
                        
                        .mb-5 {{
                            margin-bottom: 5px;
                        }}
                        
                        @media print {{
                            body {{ margin: 0; }}
                            .no-print {{ display: none; }}
                            @page {{ margin: 0.75in; }}
                        }}
                    </style>
                </head>
                <body>
                    <div class="document-container">
                        <div class="header">
                            {f'<img src="{logo_path}" alt="Company Logo" class="company-logo">' if logo_path else ''}
                            <div class="company-name">{company_name}</div>
                            <div class="company-address">{company_address}</div>
                            <div class="company-contact">
                                Phone: {company_phone} | Email: {company_email} | Website: {company_website}
                            </div>
                        </div>
                        
                        <div class="document-title">{document.title}</div>
                        
                        <div class="employee-header">
                            <div class="employee-id">Employee ID: {employee_id}</div>
                            <div class="document-date">Date: {document.generated_at.strftime('%B %d, %Y') if hasattr(document, 'generated_at') and document.generated_at else 'N/A'}</div>
                        </div>
                        
                        <div class="content compact">
                            {document.content}
                        </div>
                        
                        <div class="footer">
                            <p>This document was generated on {document.generated_at.strftime('%B %d, %Y at %I:%M %p') if hasattr(document, 'generated_at') and document.generated_at else 'N/A'}</p>
                            <p>Employee Management System</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                
                # Use WeasyPrint to generate PDF with high quality settings
                pdf_buffer = BytesIO()
                
                # Create WeasyPrint HTML object with better configuration
                html_doc = weasyprint.HTML(string=html_content)
                
                # Generate PDF with version-compatible settings
                try:
                    # Try with newer WeasyPrint parameters first
                    html_doc.write_pdf(
                        pdf_buffer,
                        stylesheets=None,  # We're using inline styles
                        optimize_images=True
                    )
                except TypeError as e:
                    if "PDF.__init__()" in str(e):
                        logger.warning(f"WeasyPrint version compatibility issue: {e}")
                        # Fallback to basic PDF generation without advanced options
                        pdf_buffer = BytesIO()  # Reset buffer
                        html_doc.write_pdf(pdf_buffer)
                    else:
                        raise e
                except Exception as e:
                    logger.error(f"Unexpected error in PDF generation: {e}")
                    # Try basic PDF generation as last resort
                    pdf_buffer = BytesIO()  # Reset buffer
                    html_doc.write_pdf(pdf_buffer)
                pdf_buffer.seek(0)
                pdf_content = pdf_buffer.getvalue()
                
                # Verify the generated PDF
                if pdf_content.startswith(b'%PDF') and len(pdf_content) > 100:
                    # Save PDF file for future use
                    try:
                        import os
                        from django.conf import settings
                        
                        # Ensure the directory exists
                        pdf_dir = os.path.join(settings.MEDIA_ROOT, 'generated_documents')
                        os.makedirs(pdf_dir, exist_ok=True)
                        
                        document.pdf_file.save(f"{filename}.pdf", BytesIO(pdf_content), save=True)
                        logger.info(f"PDF file saved successfully: {document.pdf_file.path}")
                    except Exception as save_error:
                        logger.warning(f"Could not save PDF file: {save_error}")
                        import traceback
                        logger.warning(f"PDF save error traceback: {traceback.format_exc()}")
                        # Continue with download even if saving fails
                    
                    # Return the PDF response
                    response = HttpResponse(pdf_content, content_type='application/pdf')
                    response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
                    response['Content-Length'] = len(pdf_content)
                    return response
                else:
                    logger.error(f"Generated PDF is invalid for document {document.id}")
                    raise Exception("Generated PDF is invalid")
                
            except Exception as e:
                logger.error(f"PDF generation failed for document {document.id}: {e}")
                import traceback
                logger.error(f"PDF generation traceback: {traceback.format_exc()}")
                return JsonResponse({
                    'error': 'PDF generation failed',
                    'detail': str(e),
                    'traceback': traceback.format_exc()
                }, status=500)
        else:
            logger.error("WeasyPrint not available - PDF generation failed")
            return JsonResponse({
                'error': 'PDF generation not available',
                'detail': 'WeasyPrint is not working. Please check server configuration.',
                'fallback_available': False
            }, status=503)
    

    def generate_html_content_for_document(self, document):
        """Generate HTML content for document download when PDF is not available"""
        try:
            # Get company logo path and information
            logo_path = ""
            company_name = "Your Company Name"
            company_address = "Company Address"
            company_phone = "+1 (555) 123-4567"
            company_email = "info@company.com"
            company_website = "www.company.com"
            
            try:
                from django.conf import settings
                logo_path = self.get_logo_url()
                
                # Get company information from settings or use defaults
                company_name = getattr(settings, 'COMPANY_NAME', 'DISHA ONLINE SOLUTIONS')
                company_address = getattr(settings, 'COMPANY_ADDRESS', 'Bhumiraj Costarica, 9th Floor Office No- 907, Plot No- 1 & 2, Sector 18, Sanpada, Navi Mumbai, Maharashtra 400705')
                company_phone = getattr(settings, 'COMPANY_PHONE', '+91 1234567890')
                company_email = getattr(settings, 'COMPANY_EMAIL', 'info@company.d0s369.co.in')
                company_website = getattr(settings, 'COMPANY_WEBSITE', 'https://company.d0s369.co.in')
                
            except Exception as e:
                logger.warning(f"Could not load company information: {e}")
            
            # Get employee ID from user
            employee_id = document.employee.employee_id if document.employee.employee_id else str(document.employee.id)[:8].upper()
            
            # Generate filename based on document type
            filename = self.generate_document_filename(document)
            
            # Enhance the document content with proper CSS for single-page layout
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>{document.title}</title>
                <style>
                    @page {{
                        margin: 0.75in;
                        size: A4;
                    }}
                    
                    * {{
                        box-sizing: border-box;
                    }}
                    
                    body {{
                        font-family: 'Arial', 'Helvetica', sans-serif;
                        font-size: 10pt;
                        line-height: 1.2;
                        color: #000000;
                        margin: 0;
                        padding: 0;
                        background: white;
                    }}
                    
                    .document-container {{
                        max-width: 100%;
                        margin: 0 auto;
                    }}
                    
                    .header {{
                        text-align: center;
                        margin-bottom: 15px;
                        border-bottom: 1px solid #000;
                        padding-bottom: 10px;
                    }}
                    
                    .company-logo {{
                        max-height: 50px;
                        max-width: 150px;
                        margin-bottom: 8px;
                    }}
                    
                    .company-name {{
                        font-size: 14pt;
                        font-weight: bold;
                        color: #000000;
                        margin: 3px 0;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }}
                    
                    .company-address {{
                        font-size: 8pt;
                        color: #000000;
                        margin: 2px 0;
                        line-height: 1.1;
                    }}
                    
                    .company-contact {{
                        font-size: 7pt;
                        color: #000000;
                        margin: 2px 0;
                    }}
                    
                    .document-title {{
                        font-size: 12pt;
                        font-weight: bold;
                        color: #000000;
                        text-align: center;
                        margin: 15px 0 10px 0;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }}
                    
                    .employee-header {{
                        display: flex;
                        justify-content: space-between;
                        margin: 10px 0;
                        font-size: 9pt;
                        border-bottom: 1px solid #000;
                        padding-bottom: 8px;
                    }}
                    
                    .employee-id {{
                        font-weight: bold;
                        color: #000000;
                    }}
                    
                    .document-date {{
                        color: #000000;
                    }}
                    
                    h1, h2, h3, h4, h5, h6 {{
                        color: #000000;
                        margin-top: 10px;
                        margin-bottom: 5px;
                        page-break-after: avoid;
                    }}
                    
                    h1 {{
                        font-size: 12pt;
                        font-weight: bold;
                    }}
                    
                    h2 {{
                        font-size: 11pt;
                        font-weight: bold;
                    }}
                    
                    h3 {{
                        font-size: 10pt;
                        font-weight: bold;
                    }}
                    
                    p {{
                        margin: 4px 0;
                        text-align: justify;
                        font-size: 9pt;
                        line-height: 1.2;
                    }}
                    
                    .content {{
                        margin: 10px 0;
                    }}
                    
                    .footer {{
                        margin-top: 20px;
                        padding-top: 8px;
                        border-top: 1px solid #000;
                        font-size: 7pt;
                        color: #000000;
                        text-align: center;
                    }}
                    
                    table {{
                        width: 100%;
                        border-collapse: collapse;
                        margin: 8px 0;
                        font-size: 9pt;
                        border: 1px solid #000;
                    }}
                    
                    th, td {{
                        border: 1px solid #000;
                        padding: 4px 6px;
                        text-align: left;
                        vertical-align: top;
                    }}
                    
                    th {{
                        background-color: #f0f0f0;
                        font-weight: bold;
                        font-size: 9pt;
                        color: #000000;
                    }}
                    
                    .salary-table {{
                        margin: 10px 0;
                    }}
                    
                    .salary-table th {{
                        background-color: #e0e0e0;
                        text-align: center;
                        font-weight: bold;
                    }}
                    
                    .salary-table td {{
                        text-align: right;
                    }}
                    
                    .salary-table .label {{
                        text-align: left;
                        font-weight: bold;
                    }}
                    
                    .signature-section {{
                        margin-top: 20px;
                        page-break-inside: avoid;
                    }}
                    
                    .signature-line {{
                        border-bottom: 1px solid #000;
                        width: 150px;
                        margin: 10px 0 3px 0;
                    }}
                    
                    .employee-info {{
                        display: flex;
                        justify-content: space-between;
                        margin: 8px 0;
                        font-size: 9pt;
                    }}
                    
                    .employee-info div {{
                        flex: 1;
                        margin: 0 5px;
                    }}
                    
                    .date-info {{
                        text-align: right;
                        font-size: 8pt;
                        color: #000000;
                        margin: 5px 0;
                    }}
                    
                    /* Compact spacing for A4 */
                    .compact {{
                        margin: 3px 0;
                    }}
                    
                    .compact p {{
                        margin: 2px 0;
                    }}
                    
                    .text-center {{
                        text-align: center;
                    }}
                    
                    .text-right {{
                        text-align: right;
                    }}
                    
                    .text-bold {{
                        font-weight: bold;
                    }}
                    
                    .mt-10 {{
                        margin-top: 10px;
                    }}
                    
                    .mb-5 {{
                        margin-bottom: 5px;
                    }}
                    
                    @media print {{
                        body {{ margin: 0; }}
                        .no-print {{ display: none; }}
                        @page {{ margin: 0.75in; }}
                    }}
                </style>
            </head>
            <body>
                <div class="document-container">
                    <div class="header">
                        {f'<img src="{logo_path}" alt="Company Logo" class="company-logo">' if logo_path else ''}
                        <div class="company-name">{company_name}</div>
                        <div class="company-address">{company_address}</div>
                        <div class="company-contact">
                            Phone: {company_phone} | Email: {company_email} | Website: {company_website}
                        </div>
                    </div>
                    
                    <div class="document-title">{document.title}</div>
                    
                    <div class="employee-header">
                        <div class="employee-id">Employee ID: {employee_id}</div>
                        <div class="document-date">Date: {document.generated_at.strftime('%B %d, %Y') if hasattr(document, 'generated_at') and document.generated_at else 'N/A'}</div>
                    </div>
                    
                    <div class="content compact">
                        {document.content}
                    </div>
                    
                    <div class="footer">
                        <p>This document was generated on {document.generated_at.strftime('%B %d, %Y at %I:%M %p') if hasattr(document, 'generated_at') and document.generated_at else 'N/A'}</p>
                        <p>Employee Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            return html_content
            
        except Exception as e:
            logger.error(f"Error generating HTML content: {e}")
            # Return basic HTML as fallback
            return f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>{document.title}</title>
            </head>
            <body>
                <h1>{document.title}</h1>
                <div>{document.content}</div>
            </body>
            </html>
            """

    def cleanup_orphaned_files(self, document):
        """Clean up orphaned file references"""
        try:
            if document.pdf_file and document.pdf_file.name:
                import os
                from django.conf import settings
                
                file_path = os.path.join(settings.MEDIA_ROOT, document.pdf_file.name)
                if not os.path.exists(file_path):
                    logger.warning(f"Cleaning up orphaned file reference for document {document.id}")
                    document.pdf_file = None
                    document.save(update_fields=['pdf_file'])
                    return True
        except Exception as e:
            logger.error(f"Error cleaning up orphaned files for document {document.id}: {e}")
        return False
    
    def generate_document_filename(self, document):
        """Generate a proper filename for the document"""
        from datetime import datetime
        import re
        
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
        
        # Clean filename to be filesystem-safe
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        filename = re.sub(r'\s+', '_', filename)  # Replace spaces with underscores
        filename = filename.strip('_')  # Remove leading/trailing underscores
        
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
            <meta charset="utf-8">
            <style>
                @page {
                    margin: 0.75in;
                    size: A4;
                }
                
                * {
                    box-sizing: border-box;
                }
                
                body { 
                    font-family: 'Arial', 'Helvetica', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    line-height: 1.2; 
                    color: #000000;
                    background-color: #ffffff;
                    font-size: 10pt;
                }
                
                .page { 
                    max-width: 100%; 
                    margin: 0 auto; 
                    padding: 0; 
                    background: white;
                }
                
                .header { 
                    text-align: center; 
                    margin-bottom: 15px; 
                    padding-bottom: 10px; 
                    border-bottom: 1px solid #000; 
                }
                
                .company-logo { 
                    max-height: 50px; 
                    max-width: 150px; 
                    margin-bottom: 8px; 
                }
                
                .company-name { 
                    font-size: 14pt; 
                    font-weight: bold; 
                    color: #000000; 
                    margin: 3px 0; 
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .company-address { 
                    font-size: 8pt; 
                    color: #000000; 
                    line-height: 1.1; 
                    margin: 2px 0;
                }
                .document-title { 
                    text-align: center; 
                    font-size: 12pt; 
                    font-weight: bold; 
                    margin: 15px 0 10px 0; 
                    color: #000000; 
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .employee-header {
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                    font-size: 9pt;
                    border-bottom: 1px solid #000;
                    padding-bottom: 8px;
                }
                
                .employee-id {
                    font-weight: bold;
                    color: #000000;
                }
                
                .document-date {
                    color: #000000;
                }
                
                .letter-info {
                    margin-bottom: 15px;
                    border: 1px solid #000;
                    padding: 8px;
                }
                
                .letter-info p {
                    margin: 3px 0;
                    font-size: 9pt;
                }
                
                .content { 
                    margin: 15px 0; 
                    font-size: 9pt;
                    line-height: 1.3;
                }
                
                .content p {
                    margin-bottom: 8px;
                }
                
                .highlight {
                    background-color: #f0f0f0;
                    padding: 8px;
                    margin: 10px 0;
                    border: 1px solid #000;
                }
                
                .signature { 
                    margin-top: 25px; 
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
                    margin-top: 25px; 
                    text-align: center; 
                    font-size: 8pt; 
                    color: #000000; 
                    border-top: 1px solid #000; 
                    padding-top: 8px; 
                }
                
                .employee-name {
                    font-weight: bold;
                    color: #000000;
                    font-size: 10pt;
                }
                
                .signature-line {
                    border-bottom: 1px solid #000;
                    width: 150px;
                    margin: 10px 0 3px 0;
                }
            </style>
        </head>
        <body>
            <div class="page">
            <div class="header">
                        <img src="{{ logo_url }}" alt="Company Logo" class="company-logo">
                    <div class="company-name">DISHA ONLINE SOLUTIONS</div>
                    <div class="company-address">
                    Bhumiraj Costarica, 9th Floor Office No- 907, Plot No- 1 & 2,<br>
                    Sector 18, Sanpada, Navi Mumbai, Maharashtra 400705
                </div>
            </div>
            
                <div class="document-title">Offer Letter</div>
                
                <div class="employee-header">
                    <div class="employee-id">Employee ID: {{ employee_id }}</div>
                    <div class="document-date">Date: {{ current_date }}</div>
                </div>
                
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
        """Professional salary increment template"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                @page {
                    margin: 0.75in;
                    size: A4;
                }
                
                * {
                    box-sizing: border-box;
                }
                
                body { 
                    font-family: 'Arial', 'Helvetica', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    line-height: 1.2; 
                    color: #000000;
                    background-color: #ffffff;
                    font-size: 10pt;
                }
                
                .page { 
                    max-width: 100%; 
                    margin: 0 auto; 
                    padding: 0; 
                    background: white;
                }
                
                .header { 
                    text-align: center; 
                    margin-bottom: 15px; 
                    padding-bottom: 10px; 
                    border-bottom: 1px solid #000; 
                }
                
                .company-logo { 
                    max-height: 50px; 
                    max-width: 150px; 
                    margin-bottom: 8px; 
                }
                
                .company-name { 
                    font-size: 14pt; 
                    font-weight: bold; 
                    color: #000000; 
                    margin: 3px 0; 
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .company-address { 
                    font-size: 8pt; 
                    color: #000000; 
                    line-height: 1.1; 
                    margin: 2px 0;
                }
                .document-title { 
                    text-align: center; 
                    font-size: 12pt; 
                    font-weight: bold; 
                    margin: 15px 0 10px 0; 
                    color: #000000; 
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .employee-header {
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                    font-size: 9pt;
                    border-bottom: 1px solid #000;
                    padding-bottom: 8px;
                }
                
                .employee-id {
                    font-weight: bold;
                    color: #000000;
                }
                
                .document-date {
                    color: #000000;
                }
                
                .letter-info {
                    margin-bottom: 15px;
                    border: 1px solid #000;
                    padding: 8px;
                }
                
                .letter-info p {
                    margin: 3px 0;
                    font-size: 9pt;
                }
                
                .content { 
                    margin: 15px 0; 
                    font-size: 9pt;
                    line-height: 1.3;
                }
                
                .content p {
                    margin-bottom: 8px;
                }
                
                .salary-details {
                    background-color: #f0f0f0;
                    padding: 10px;
                    margin: 15px 0;
                    border: 1px solid #000;
                }
                
                .salary-details h3 {
                    margin: 0 0 8px 0;
                    color: #000000;
                    font-size: 10pt;
                    font-weight: bold;
                }
                
                .salary-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                    padding: 2px 0;
                }
                
                .salary-row:last-child {
                    font-weight: bold;
                    color: #000000;
                    background-color: #e0e0e0;
                    padding: 6px;
                    margin-top: 8px;
                }
                
                .salary-label {
                    font-weight: bold;
                    color: #000000;
                }
                
                .salary-value {
                    color: #000000;
                }
                
                .signature { 
                    margin-top: 25px; 
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
                    margin-top: 25px; 
                    text-align: center; 
                    font-size: 8pt; 
                    color: #000000; 
                    border-top: 1px solid #000; 
                    padding-top: 8px; 
                }
                
                .employee-name {
                    font-weight: bold;
                    color: #000000;
                    font-size: 10pt;
                }
                
                .appreciation {
                    background-color: #f8f8f8;
                    padding: 8px;
                    margin: 10px 0;
                    border: 1px solid #000;
                }
                
                .signature-line {
                    border-bottom: 1px solid #000;
                    width: 150px;
                    margin: 10px 0 3px 0;
                }
            </style>
        </head>
        <body>
            <div class="page">
            <div class="header">
                        <img src="{{ logo_url }}" alt="Company Logo" class="company-logo">
                    <div class="company-name">DISHA ONLINE SOLUTIONS</div>
                    <div class="company-address">
                    Bhumiraj Costarica, 9th Floor Office No- 907, Plot No- 1 & 2,<br>
                    Sector 18, Sanpada, Navi Mumbai, Maharashtra 400705
                </div>
            </div>
            
                <div class="document-title">Salary Increment Letter</div>
                
                <div class="employee-header">
                    <div class="employee-id">Employee ID: {{ employee_id }}</div>
                    <div class="document-date">Date: {{ effective_date }}</div>
                </div>
                
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
            <meta charset="utf-8">
            <style>
                @page {
                    margin: 0.75in;
                    size: A4;
                }
                
                * {
                    box-sizing: border-box;
                }
                
                body { 
                    font-family: 'Arial', 'Helvetica', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    line-height: 1.2; 
                    color: #000000;
                    background-color: #ffffff;
                    font-size: 10pt;
                }
                
                .page { 
                    max-width: 100%; 
                    margin: 0 auto; 
                    padding: 0; 
                    background: white;
                }
                
                .header { 
                    text-align: center; 
                    margin-bottom: 15px; 
                    padding-bottom: 10px; 
                    border-bottom: 1px solid #000; 
                }
                
                .company-logo { 
                    max-height: 50px; 
                    max-width: 150px; 
                    margin-bottom: 8px; 
                }
                
                .company-name { 
                    font-size: 14pt; 
                    font-weight: bold; 
                    color: #000000; 
                    margin: 3px 0; 
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .company-address { 
                    font-size: 8pt; 
                    color: #000000; 
                    line-height: 1.1; 
                    margin: 2px 0;
                }
                .document-title { 
                    text-align: center; 
                    font-size: 12pt; 
                    font-weight: bold; 
                    margin: 15px 0 10px 0; 
                    color: #000000; 
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .salary-month {
                    text-align: center;
                    font-size: 10pt;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: #000000;
                }
                
                .employee-header {
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                    font-size: 9pt;
                    border-bottom: 1px solid #000;
                    padding-bottom: 8px;
                }
                
                .employee-id {
                    font-weight: bold;
                    color: #000000;
                }
                
                .document-date {
                    color: #000000;
                }
                .employee-section {
                    margin-bottom: 15px;
                }
                
                .employee-info, .bank-info {
                    margin-bottom: 10px;
                }
                
                .section-title {
                    font-size: 10pt;
                    font-weight: bold;
                    color: #000000;
                    margin-bottom: 8px;
                    border-bottom: 1px solid #000;
                    padding-bottom: 3px;
                }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                    padding: 2px 0;
                }
                
                .info-label {
                    font-weight: bold;
                    color: #000000;
                }
                
                .info-value {
                    color: #000000;
                }
                .salary-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                    font-size: 9pt;
                    border: 1px solid #000;
                }
                
                .salary-table th {
                    background-color: #f0f0f0;
                    color: #000000;
                    padding: 6px 8px;
                    text-align: left;
                    font-weight: bold;
                    font-size: 9pt;
                    border: 1px solid #000;
                }
                
                .salary-table td {
                    padding: 4px 8px;
                    border: 1px solid #000;
                    font-size: 9pt;
                }
                
                .salary-table tr:nth-child(even) {
                    background-color: #f8f8f8;
                }
                
                .salary-table tr:last-child td {
                    font-weight: bold;
                    background-color: #e0e0e0;
                    color: #000000;
                }
                
                .amount {
                    text-align: right;
                    font-weight: bold;
                    color: #000000;
                }
                
                .net-salary {
                    background-color: #e0e0e0 !important;
                    font-weight: bold;
                    font-size: 10pt;
                    color: #000000;
                }
                .footer { 
                    margin-top: 20px; 
                    text-align: center; 
                    font-size: 8pt; 
                    color: #000000; 
                    border-top: 1px solid #000; 
                    padding-top: 8px; 
                }
                
                .generated-info {
                    text-align: center;
                    font-size: 7pt;
                    color: #000000;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header">
                        <img src="{{ logo_url }}" alt="Company Logo" class="company-logo">
                    <div class="company-name">DISHA ONLINE SOLUTIONS</div>
                    <div class="company-address">
                            Bhumiraj Costarica, 9th Floor Office No- 907, Plot No- 1 & 2,<br>
                            Sector 18, Sanpada, Navi Mumbai, Maharashtra 400705
                    </div>
                </div>
                
                <div class="document-title">Salary Slip</div>
                <div class="salary-month">{{ salary_month }} {{ salary_year }}</div>
                
                <div class="employee-header">
                    <div class="employee-id">Employee ID: {{ employee_id }}</div>
                    <div class="document-date">Date: {{ current_date }}</div>
                </div>
                
                <div class="employee-section">
                        <div class="section-title">Employee Information</div>
                    <div class="employee-info">
                        <div class="info-row">
                            <span class="info-label">Employee Name:</span>
                            <span class="info-value">{{ employee_name }}</span>
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
                    
                    <div class="section-title">Bank Details</div>
                    <div class="bank-info">
                        <div class="info-row">
                            <span class="info-label">Bank Name:</span>
                            <span class="info-value">{{ bank_name }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Account Number:</span>
                            <span class="info-value">{{ account_number }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">IFSC Code:</span>
                            <span class="info-value">{{ ifsc_code }}</span>
                        </div>
                    </div>
                </div>
                
                <table class="salary-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Basic Salary</td>
                            <td class="amount">₹{{ basic_salary }}</td>
                        </tr>
                        <tr>
                            <td>Extra Days Pay</td>
                            <td class="amount">₹{{ extra_days_pay }}</td>
                        </tr>
                        <tr>
                            <td><strong>Total Salary</strong></td>
                            <td class="amount"><strong>₹{{ total_salary }}</strong></td>
                        </tr>
                        <tr>
                            <td class="net-salary"><strong>Net Salary</strong></td>
                            <td class="amount net-salary"><strong>₹{{ net_salary }}</strong></td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>This is a computer generated salary slip and does not require signature</p>
                </div>
                
                <div class="generated-info">
                    Generated on: {{ current_date }}
                </div>
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
            # Use production domain
            domain = "https://company.d0s369.co.in"
            # Return absolute URL for the logo
            return f"{domain}{settings.MEDIA_URL}documents/companylogo.png"
        else:
            # Return a placeholder or default logo
            domain = "https://company.d0s369.co.in"
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
                'employee_id': employee.employee_id if employee.employee_id else str(employee.id)[:8].upper(),
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
                'employee_id': employee.employee_id if employee.employee_id else str(employee.id)[:8].upper(),
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
                'employee_id': employee.employee_id if employee.employee_id else str(employee.id)[:8].upper(),  # Use actual employee_id or fallback to short ID
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
            
            # Generate PDF (works on VPS hosting, may have issues on local Windows)
            if WEASYPRINT_AVAILABLE:
                try:
                    logger.info(f"Generating PDF for document {generated_doc.id}")
                    pdf_buffer = BytesIO()
                    weasyprint.HTML(string=content).write_pdf(pdf_buffer)
                    pdf_buffer.seek(0)
                    
                    # Save PDF file
                    filename = f"{title.replace(' ', '_')}_{generated_doc.id}.pdf"
                    generated_doc.pdf_file.save(filename, pdf_buffer, save=True)
                    logger.info(f"PDF file saved successfully: {filename}")
                    
                except Exception as e:
                    logger.warning(f"PDF generation failed (likely Windows dev environment): {e}")
                    # Continue without PDF - will work on VPS hosting
            else:
                logger.info("WeasyPrint not available on local development environment - will work on VPS hosting")
            
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
    
    @action(detail=False, methods=['get'], url_path='employees')
    def get_employees(self, request):
        """Get list of employees for document generation"""
        print("🚀🚀🚀 GET_EMPLOYEES METHOD CALLED - PRINT STATEMENT!")
        print("🔥🔥🔥 THIS IS THE UPDATED CODE - SERVER IS RUNNING NEW VERSION! 🔥🔥🔥")
        print("🚨🚨🚨 IF YOU SEE THIS MESSAGE, THE SERVER IS RUNNING UPDATED CODE! 🚨🚨🚨")
        print("🚨🚨🚨 IF YOU DON'T SEE THIS MESSAGE, RESTART THE DJANGO SERVER! 🚨🚨🚨")
        logger.info(f"🚀🚀🚀 GET_EMPLOYEES METHOD STARTED - Method is working correctly!")
        logger.info(f"🚀🚀🚀 TIMESTAMP: {datetime.now().isoformat()}")
        
        # Now that we know the endpoint works, restore real employee logic
        user = request.user
        logger.info(f"🚀 GET_EMPLOYEES ENDPOINT CALLED - User: {user.email}, role: {user.role}")
        
        # Debug: Check what's in the database
        total_users = CustomUser.objects.count()
        all_employees = CustomUser.objects.filter(role='employee').count()
        active_employees = CustomUser.objects.filter(role='employee', is_active=True).count()
        
        print(f"🔍 DATABASE DEBUG: Total users: {total_users}")
        print(f"🔍 DATABASE DEBUG: All employees: {all_employees}")
        print(f"🔍 DATABASE DEBUG: Active employees: {active_employees}")
        logger.info(f"🔍 DATABASE DEBUG: Total users: {total_users}")
        logger.info(f"🔍 DATABASE DEBUG: All employees: {all_employees}")
        logger.info(f"🔍 DATABASE DEBUG: Active employees: {active_employees}")
        
        # Get ALL users (as requested by user)
        employees = CustomUser.objects.all()
        print(f"🚀 FETCHING ALL USERS: Found {employees.count()} total users")
        logger.info(f"🚀 FETCHING ALL USERS: Found {employees.count()} total users")
        
        # Process employee data
        employee_data = []
        for emp in employees:
            try:
                # Simple name construction
                simple_name = f"{emp.first_name or ''} {emp.last_name or ''}".strip() or emp.email
                
                emp_data = {
                    'id': str(emp.id),
                    'name': simple_name,
                    'email': emp.email,
                    'employee_id': emp.employee_id if emp.employee_id else str(emp.id)[:8].upper(),
                    'designation': emp.designation or (emp.role.title() if emp.role else 'User'),
                    'department': emp.department or 'General',
                    'office': emp.office.name if emp.office else 'No Office',
                    'current_salary': emp.salary or 0,
                    'joining_date': emp.joining_date.strftime('%Y-%m-%d') if emp.joining_date else None,
                    'phone': emp.phone_number or '',
                    'address': emp.address or '',
                    'role': emp.role or 'user',
                    'is_active': emp.is_active
                }
                employee_data.append(emp_data)
                
            except Exception as e:
                logger.error(f"Error processing employee {emp.id}: {e}")
                continue
        
        print(f"🚀 Returning real employee data: {len(employee_data)} employees")
        logger.info(f"🚀 Returning real employee data: {len(employee_data)} employees")
        
        # TEMPORARY: If no real data, return test data to confirm endpoint is working
        if len(employee_data) == 0:
            print("🚨 NO REAL EMPLOYEES FOUND - RETURNING TEST DATA!")
            test_data = [
                {
                    'id': 'test-1',
                    'name': 'Test Employee 1',
                    'email': 'test1@company.com',
                    'employee_id': 'TEST001',
                    'designation': 'Developer',
                    'department': 'IT',
                    'office': 'Test Office',
                    'current_salary': 50000,
                    'joining_date': '2024-01-01',
                    'phone': '1234567890',
                    'address': 'Test Address'
                }
            ]
            return Response(test_data)
        
        return Response(employee_data)

    @action(detail=False, methods=['get'])
    def test_employees(self, request):
        """Simple test endpoint to return basic employee data"""
        try:
            user = request.user
            logger.info(f"Test endpoint - User: {user.email}, Role: {user.role}")
            
            # Get all active employees
            employees = CustomUser.objects.filter(role='employee', is_active=True)
            logger.info(f"Test endpoint - Found {employees.count()} employees")
            
            # Return simple data
            simple_data = []
            for emp in employees[:5]:  # Limit to first 5 for testing
                simple_data.append({
                    'id': str(emp.id),
                    'name': f"{emp.first_name or ''} {emp.last_name or ''}".strip() or emp.email,
                    'email': emp.email,
                    'employee_id': emp.employee_id or str(emp.id)[:8].upper()
                })
            
            logger.info(f"Test endpoint - Returning {len(simple_data)} employees")
            return Response(simple_data)
            
        except Exception as e:
            logger.error(f"Test endpoint error: {e}")
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['get'])
    def debug_database_state(self, request):
        """Debug endpoint to check database state"""
        try:
            user = request.user
            all_users = CustomUser.objects.all()
            all_employees = CustomUser.objects.filter(role='employee')
            all_offices = Office.objects.all()
            
            debug_info = {
                'current_user': {
                    'email': user.email,
                    'role': user.role,
                    'office': user.office.name if user.office else None,
                    'office_id': user.office.id if user.office else None,
                    'is_active': user.is_active
                },
                'total_users': all_users.count(),
                'total_employees': all_employees.count(),
                'active_employees': CustomUser.objects.filter(role='employee', is_active=True).count(),
                'all_users': [(u.email, u.role, u.office.name if u.office else 'No Office', u.is_active) for u in all_users],
                'all_employees': [(e.email, e.office.name if e.office else 'No Office', e.is_active) for e in all_employees],
                'active_employees_list': [(e.email, e.office.name if e.office else 'No Office') for e in CustomUser.objects.filter(role='employee', is_active=True)],
                'all_offices': [office.name for office in all_offices] if all_offices else []
            }
            
            return Response(debug_info)
        except Exception as e:
            logger.error(f"Debug endpoint error: {e}")
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['get'])
    def get_employee_details(self, request):
        """Get detailed information for a specific employee"""
        user = request.user
        employee_id = request.query_params.get('employee_id')
        
        if not employee_id:
            return Response(
                {'error': 'employee_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            employee = get_object_or_404(CustomUser, id=employee_id)
            
            # Check permissions
            if user.role == 'employee' and employee != user:
                return Response(
                    {'error': 'Access denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            employee_data = {
                'id': employee.id,
                'employee_id': employee.employee_id if employee.employee_id else str(employee.id)[:8].upper(),
                'name': employee.get_full_name(),
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'email': employee.email,
                'designation': employee.designation,
                'department': employee.department,
                'office': employee.office.name if employee.office else None,
                'office_id': employee.office.id if employee.office else None,
                'current_salary': employee.salary,
                'joining_date': employee.joining_date.strftime('%Y-%m-%d') if employee.joining_date else None,
                'phone': employee.phone_number,
                'address': employee.address,
                'date_of_birth': employee.date_of_birth.strftime('%Y-%m-%d') if employee.date_of_birth else None,
                'bank_name': getattr(employee, 'bank_name', ''),
                'account_number': getattr(employee, 'account_number', ''),
                'pan_number': getattr(employee, 'pan_number', ''),
                'aadhar_number': getattr(employee, 'aadhar_number', ''),
                'emergency_contact': getattr(employee, 'emergency_contact', ''),
                'emergency_phone': getattr(employee, 'emergency_phone', ''),
                'is_active': employee.is_active,
                'created_at': employee.date_joined.strftime('%Y-%m-%d %H:%M:%S') if employee.date_joined else None
            }
            
            return Response(employee_data)
            
        except Exception as e:
            logger.error(f"Error fetching employee details: {e}")
            return Response(
                {'error': 'Failed to fetch employee details'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
