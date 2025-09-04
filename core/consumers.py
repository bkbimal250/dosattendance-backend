import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Attendance, CustomUser


class AttendanceConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time attendance updates.
    Broadcasts attendance changes to all connected clients.
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        # Accept the connection
        await self.accept()
        
        # Join the attendance group (all clients receive updates)
        await self.channel_layer.group_add(
            "attendance_updates",
            self.channel_name
        )
        
        print(f"WebSocket connected: {self.channel_name}")
        
        # Send initial connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to attendance updates'
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave the attendance group
        await self.channel_layer.group_discard(
            "attendance_updates",
            self.channel_name
        )
        print(f"WebSocket disconnected: {self.channel_name}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))
            elif message_type == 'get_latest':
                # Send latest attendance data
                latest_attendance = await self.get_latest_attendance()
                await self.send(text_data=json.dumps({
                    'type': 'latest_attendance',
                    'data': latest_attendance
                }))
                
        except json.JSONDecodeError:
            print("Invalid JSON received")
        except Exception as e:
            print(f"Error processing message: {e}")
    
    async def attendance_update(self, event):
        """Send attendance update to WebSocket"""
        # Send the attendance update to the WebSocket
        await self.send(text_data=json.dumps({
            'type': 'attendance_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_latest_attendance(self):
        """Get latest attendance records from database"""
        try:
            # Get the latest 10 attendance records
            latest_records = Attendance.objects.select_related(
                'user', 'user__office', 'device'
            ).order_by('-created_at')[:10]
            
            # Serialize the data
            attendance_data = []
            for record in latest_records:
                attendance_data.append({
                    'id': str(record.id),
                    'user_name': record.user.get_full_name(),
                    'employee_id': record.user.employee_id,
                    'office': record.user.office.name if record.user.office else None,
                    'date': record.date.isoformat(),
                    'check_in_time': record.check_in_time.isoformat() if record.check_in_time else None,
                    'check_out_time': record.check_out_time.isoformat() if record.check_out_time else None,
                    'status': record.status,
                    'device': record.device.name if record.device else None,
                    'created_at': record.created_at.isoformat(),
                    'updated_at': record.updated_at.isoformat(),
                })
            
            return attendance_data
        except Exception as e:
            print(f"Error fetching latest attendance: {e}")
            return []


# Utility function to broadcast attendance updates
async def broadcast_attendance_update(attendance_data):
    """
    Broadcast attendance update to all connected WebSocket clients.
    This function should be called from views or signals when attendance changes.
    """
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    channel_layer = get_channel_layer()
    
    await channel_layer.group_send(
        "attendance_updates",
        {
            "type": "attendance_update",
            "data": attendance_data
        }
    )


# Synchronous version for use in Django views/signals
def broadcast_attendance_update_sync(attendance_data):
    """
    Synchronous version of broadcast_attendance_update for use in Django views/signals.
    """
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    channel_layer = get_channel_layer()
    
    async_to_sync(channel_layer.group_send)(
        "attendance_updates",
        {
            "type": "attendance_update",
            "data": attendance_data
        }
    )
