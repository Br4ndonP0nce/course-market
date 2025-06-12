# lambda/video-trigger/lambda_function.py
import boto3
import json
import os
import logging
from urllib.parse import unquote_plus

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
ecs_client = boto3.client('ecs')
s3_client = boto3.client('s3')

def lambda_handler(event, context):
    """
    Lambda function to trigger Fargate video processing tasks
    """
    logger.info(f"Received S3 event: {json.dumps(event, indent=2)}")
    
    try:
        for record in event['Records']:
            if record['eventName'].startswith('ObjectCreated:'):
                process_s3_event(record)
        
        return {
            'statusCode': 200,
            'body': json.dumps('Video processing tasks triggered successfully')
        }
    
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }

def process_s3_event(record):
    """
    Process individual S3 record and start Fargate task
    """
    try:
        # Extract S3 information
        bucket_name = record['s3']['bucket']['name']
        object_key = unquote_plus(record['s3']['object']['key'])
        object_size = record['s3']['object']['size']
        
        logger.info(f"Processing file: s3://{bucket_name}/{object_key} ({object_size} bytes)")
        
        # Get object metadata
        response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
        metadata = response.get('Metadata', {})
        
        lesson_id = metadata.get('lessonid')
        creator_id = metadata.get('creatorid')
        upload_id = metadata.get('uploadid')
        
        if not lesson_id or not creator_id:
            logger.error(f"Missing required metadata in file {object_key}")
            return
        
        logger.info(f"Found metadata - Lesson: {lesson_id}, Creator: {creator_id}, Upload: {upload_id}")
        
        # Update lesson status to processing
        update_lesson_status(lesson_id, 'processing', 10)
        
        # Start Fargate task
        task_arn = start_video_processing_task(
            input_bucket=bucket_name,
            input_key=object_key,
            lesson_id=lesson_id,
            creator_id=creator_id,
            upload_id=upload_id
        )
        
        # Update lesson with task ARN
        update_lesson_task_id(lesson_id, task_arn)
        
        logger.info(f"Started Fargate task: {task_arn}")
        
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        # Try to update lesson status with error
        if 'lesson_id' in locals():
            update_lesson_status(lesson_id, 'failed', 0, str(e))
        raise

def start_video_processing_task(input_bucket, input_key, lesson_id, creator_id, upload_id):
    """
    Start Fargate task for video processing
    """
    try:
        # Task definition and cluster from environment
        task_definition = os.environ['FARGATE_TASK_DEFINITION']
        cluster_name = os.environ['FARGATE_CLUSTER']
        subnet_id = os.environ['FARGATE_SUBNET']
        security_group = os.environ['FARGATE_SECURITY_GROUP']
        
        # Container overrides with job parameters
        container_overrides = {
            'name': 'video-processor',
            'environment': [
                {'name': 'INPUT_BUCKET', 'value': input_bucket},
                {'name': 'INPUT_KEY', 'value': input_key},
                {'name': 'OUTPUT_BUCKET', 'value': os.environ['OUTPUT_BUCKET']},
                {'name': 'LESSON_ID', 'value': lesson_id},
                {'name': 'CREATOR_ID', 'value': creator_id},
                {'name': 'UPLOAD_ID', 'value': upload_id},
                {'name': 'API_BASE_URL', 'value': os.environ['API_BASE_URL']},
                {'name': 'API_KEY', 'value': os.environ['INTERNAL_API_KEY']},
            ]
        }
        
        # Run Fargate task
        response = ecs_client.run_task(
            cluster=cluster_name,
            taskDefinition=task_definition,
            launchType='FARGATE',
            networkConfiguration={
                'awsvpcConfiguration': {
                    'subnets': [subnet_id],
                    'securityGroups': [security_group],
                    'assignPublicIp': 'ENABLED'  # Needed for Docker Hub access
                }
            },
            overrides={
                'containerOverrides': [container_overrides]
            },
            tags=[
                {
                    'key': 'LessonId',
                    'value': lesson_id
                },
                {
                    'key': 'CreatorId', 
                    'value': creator_id
                },
                {
                    'key': 'Purpose',
                    'value': 'VideoProcessing'
                }
            ]
        )
        
        task_arn = response['tasks'][0]['taskArn']
        logger.info(f"Fargate task started successfully: {task_arn}")
        
        return task_arn
        
    except Exception as e:
        logger.error(f"Failed to start Fargate task: {str(e)}")
        raise

def update_lesson_status(lesson_id, status, progress, error=None):
    """
    Update lesson processing status via API
    """
    try:
        import requests
        
        url = f"{os.environ['API_BASE_URL']}/api/lessons/{lesson_id}/processing-update"
        
        payload = {
            'status': status,
            'progress': progress
        }
        
        if error:
            payload['error'] = error
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {os.environ['INTERNAL_API_KEY']}"
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            logger.info(f"Updated lesson {lesson_id} status to {status} ({progress}%)")
        else:
            logger.error(f"Failed to update lesson status: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error updating lesson status: {str(e)}")

def update_lesson_task_id(lesson_id, task_arn):
    """
    Store Fargate task ARN for tracking
    """
    try:
        import requests
        
        url = f"{os.environ['API_BASE_URL']}/api/lessons/{lesson_id}/task-id"
        
        payload = {'taskArn': task_arn}
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {os.environ['INTERNAL_API_KEY']}"
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            logger.info(f"Stored task ARN for lesson {lesson_id}")
        else:
            logger.error(f"Failed to store task ARN: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error storing task ARN: {str(e)}")
