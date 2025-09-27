"""
ID Card Generation Service using Pillow
Generates professional employee ID cards in 50mm x 85mm format
"""
from PIL import Image, ImageDraw, ImageFont
from django.conf import settings
import os
import logging
from io import BytesIO
from datetime import datetime

logger = logging.getLogger(__name__)


class IDCardGenerator:
    """Service for generating employee ID cards"""
    
    # ID Card dimensions in pixels (50mm x 85mm at 300 DPI)
    CARD_WIDTH = 591  # 50mm at 300 DPI
    CARD_HEIGHT = 1004  # 85mm at 300 DPI
    
    # Colors (matching the design)
    PRIMARY_RED = (220, 20, 60)  # Red color
    PRIMARY_BLUE = (0, 102, 204)  # Blue color
    WHITE = (255, 255, 255)
    BLACK = (0, 0, 0)
    LIGHT_GRAY = (240, 240, 240)
    
    def __init__(self):
        self.base_path = getattr(settings, 'BASE_DIR', '')
        self.media_path = getattr(settings, 'MEDIA_ROOT', 'media')
        
    def get_font(self, size, bold=False):
        """Get font with fallback options"""
        try:
            if bold:
                # Try to use a bold font
                font_paths = [
                    os.path.join(self.base_path, 'static', 'fonts', 'Arial-Bold.ttf'),
                    os.path.join(self.base_path, 'static', 'fonts', 'arial-bold.ttf'),
                    '/System/Library/Fonts/Arial Bold.ttf',  # macOS
                    'C:/Windows/Fonts/arialbd.ttf',  # Windows
                ]
            else:
                font_paths = [
                    os.path.join(self.base_path, 'static', 'fonts', 'Arial.ttf'),
                    os.path.join(self.base_path, 'static', 'fonts', 'arial.ttf'),
                    '/System/Library/Fonts/Arial.ttf',  # macOS
                    'C:/Windows/Fonts/arial.ttf',  # Windows
                ]
            
            for font_path in font_paths:
                if os.path.exists(font_path):
                    return ImageFont.truetype(font_path, size)
            
            # Fallback to default font
            return ImageFont.load_default()
            
        except Exception as e:
            logger.warning(f"Font loading failed: {e}, using default font")
            return ImageFont.load_default()
    
    def get_company_logo(self):
        """Get company logo with fallback"""
        logo_paths = [
            os.path.join(self.media_path, 'documents', 'companylogo.png'),
            os.path.join(self.media_path, 'documents', 'company_logo.png'),
            os.path.join(self.base_path, 'static', 'images', 'logo.png'),
        ]
        
        for logo_path in logo_paths:
            if os.path.exists(logo_path):
                try:
                    logo = Image.open(logo_path)
                    # Resize logo to fit
                    logo.thumbnail((80, 80), Image.Resampling.LANCZOS)
                    return logo
                except Exception as e:
                    logger.warning(f"Logo loading failed: {e}")
                    continue
        
        # Return None if no logo found
        return None
    
    def create_header_strip(self, width, height=40):
        """Create the header strip with red and blue colors"""
        strip = Image.new('RGB', (width, height), self.WHITE)
        draw = ImageDraw.Draw(strip)
        
        # Create diagonal pattern
        for i in range(0, width + height, 10):
            # Red diagonal lines
            draw.line([(i, 0), (i - height, height)], fill=self.PRIMARY_RED, width=3)
            # Blue diagonal lines (offset)
            draw.line([(i + 5, 0), (i - height + 5, height)], fill=self.PRIMARY_BLUE, width=3)
        
        return strip
    
    def create_footer_strip(self, width, height=40):
        """Create the footer strip (same as header)"""
        return self.create_header_strip(width, height)
    
    def generate_id_card(self, employee_data, company_data):
        """Generate ID card for employee"""
        try:
            # Create base image
            card = Image.new('RGB', (self.CARD_WIDTH, self.CARD_HEIGHT), self.WHITE)
            draw = ImageDraw.Draw(card)
            
            # Create header strip
            header_strip = self.create_header_strip(self.CARD_WIDTH, 40)
            card.paste(header_strip, (0, 0))
            
            # Create footer strip
            footer_strip = self.create_footer_strip(self.CARD_WIDTH, 40)
            card.paste(footer_strip, (0, self.CARD_HEIGHT - 40))
            
            # Add company logo
            logo = self.get_company_logo()
            if logo:
                # Center logo in header area
                logo_x = (self.CARD_WIDTH - logo.width) // 2
                logo_y = 20
                card.paste(logo, (logo_x, logo_y), logo if logo.mode == 'RGBA' else None)
            
            # Add company name
            company_font = self.get_font(28, bold=True)
            company_name = company_data.get('name', 'DISHA ONLINE SOLUTIONS')
            company_bbox = draw.textbbox((0, 0), company_name, font=company_font)
            company_width = company_bbox[2] - company_bbox[0]
            company_x = (self.CARD_WIDTH - company_width) // 2
            company_y = 100
            draw.text((company_x, company_y), company_name, fill=self.PRIMARY_BLUE, font=company_font)
            
            # Add tagline
            tagline_font = self.get_font(14)
            tagline = company_data.get('tagline', 'ONLINE SOLUTION')
            tagline_bbox = draw.textbbox((0, 0), tagline, font=tagline_font)
            tagline_width = tagline_bbox[2] - tagline_bbox[0]
            tagline_x = (self.CARD_WIDTH - tagline_width) // 2
            tagline_y = company_y + 35
            draw.text((tagline_x, tagline_y), tagline, fill=self.PRIMARY_BLUE, font=tagline_font)
            
            # Add employee photo frame
            photo_frame_size = 120
            photo_x = (self.CARD_WIDTH - photo_frame_size) // 2
            photo_y = 180
            
            # Draw photo frame border
            draw.rectangle([photo_x, photo_y, photo_x + photo_frame_size, photo_y + photo_frame_size], 
                         outline=self.PRIMARY_BLUE, width=2)
            
            # Add employee photo if available
            if employee_data.get('photo_path') and os.path.exists(employee_data['photo_path']):
                try:
                    photo = Image.open(employee_data['photo_path'])
                    photo = photo.resize((photo_frame_size - 4, photo_frame_size - 4), Image.Resampling.LANCZOS)
                    card.paste(photo, (photo_x + 2, photo_y + 2))
                except Exception as e:
                    logger.warning(f"Photo loading failed: {e}")
                    # Draw placeholder
                    draw.rectangle([photo_x + 2, photo_y + 2, photo_x + photo_frame_size - 2, photo_y + photo_frame_size - 2], 
                                 fill=self.LIGHT_GRAY)
                    draw.text((photo_x + photo_frame_size//2 - 20, photo_y + photo_frame_size//2 - 10), 
                            "PHOTO", fill=self.BLACK, font=self.get_font(12))
            
            # Add employee name
            name_font = self.get_font(20, bold=True)
            employee_name = employee_data.get('name', 'EMPLOYEE NAME')
            name_bbox = draw.textbbox((0, 0), employee_name, font=name_font)
            name_width = name_bbox[2] - name_bbox[0]
            name_x = (self.CARD_WIDTH - name_width) // 2
            name_y = photo_y + photo_frame_size + 20
            draw.text((name_x, name_y), employee_name, fill=self.BLACK, font=name_font)
            
            # Add employee details
            details_y = name_y + 40
            detail_font = self.get_font(12)
            label_font = self.get_font(12, bold=True)
            
            details = [
                ('Employee Id', employee_data.get('employee_id', 'N/A')),
                ('Date Of Joining', employee_data.get('joining_date', 'N/A')),
                ('Designation', employee_data.get('designation', 'N/A')),
                ('Department', employee_data.get('department', 'N/A')),
                ('Contact No', employee_data.get('phone', 'N/A')),
                ('Issue Date', datetime.now().strftime('%d-%m-%Y')),
            ]
            
            for i, (label, value) in enumerate(details):
                y_pos = details_y + (i * 25)
                
                # Draw label
                draw.text((50, y_pos), f"{label}:", fill=self.BLACK, font=label_font)
                
                # Draw value
                draw.text((200, y_pos), str(value), fill=self.BLACK, font=detail_font)
            
            # Add company address at bottom
            address_font = self.get_font(10)
            address = company_data.get('address', 'Company Address')
            address_lines = address.split('\n')
            address_y = self.CARD_HEIGHT - 80
            
            for i, line in enumerate(address_lines):
                line_bbox = draw.textbbox((0, 0), line, font=address_font)
                line_width = line_bbox[2] - line_bbox[0]
                line_x = (self.CARD_WIDTH - line_width) // 2
                draw.text((line_x, address_y + (i * 15)), line, fill=self.BLACK, font=address_font)
            
            return card
            
        except Exception as e:
            logger.error(f"ID card generation failed: {e}")
            raise
    
    def save_id_card(self, card_image, filename):
        """Save ID card to file"""
        try:
            # Create output buffer
            output = BytesIO()
            card_image.save(output, format='PNG', quality=95)
            output.seek(0)
            return output
        except Exception as e:
            logger.error(f"ID card saving failed: {e}")
            raise
    
    def generate_id_card_for_employee(self, employee, company_data=None):
        """Generate ID card for a specific employee"""
        try:
            # Default company data
            if not company_data:
                company_data = {
                    'name': 'DISHA ONLINE SOLUTIONS',
                    'tagline': 'ONLINE SOLUTION',
                    'address': '9th Floor Office no-907, Bhumiraj Costarica, Plot\nNo- 1& 2, Sector 18, Sanpada, Navi Mumbai,\nMaharashtra 400705'
                }
            
            # Prepare employee data
            employee_data = {
                'name': employee.get_full_name().upper(),
                'employee_id': employee.employee_id or 'N/A',
                'joining_date': employee.joining_date.strftime('%d-%m-%Y') if employee.joining_date else 'N/A',
                'designation': employee.designation or 'N/A',
                'department': employee.department or 'N/A',
                'phone': employee.phone or 'N/A',
                'photo_path': employee.profile_picture.path if employee.profile_picture else None
            }
            
            # Generate ID card
            card_image = self.generate_id_card(employee_data, company_data)
            
            # Save to buffer
            filename = f"ID_Card_{employee.employee_id}_{employee.get_full_name().replace(' ', '_')}.png"
            return self.save_id_card(card_image, filename)
            
        except Exception as e:
            logger.error(f"ID card generation for employee {employee.id} failed: {e}")
            raise
