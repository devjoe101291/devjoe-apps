# R2 Multipart Upload Implementation Guide

## Overview

This document describes the implementation of multipart uploads for large files (>50MB) using Cloudflare R2 storage. The solution enables reliable uploads of files up to 500MB while providing progress tracking and error handling.

## Architecture

### Components

1. **Frontend ([src/lib/r2Upload.ts](file:///d:/Joey%20Ventulan/devjoe-showcase-studio/src/lib/r2Upload.ts))**
   - Client-side coordination of multipart uploads
   - Progress tracking and user feedback
   - Error handling and recovery

2. **Backend API ([api/upload-to-r2.js](file:///d:/Joey%20Ventulan/devjoe-showcase-studio/api/upload-to-r2.js))**
   - Secure R2 API interactions
   - Presigned URL generation
   - Multipart upload lifecycle management

3. **Integration Layer ([src/lib/uploadUtils.ts](file:///d:/Joey%20Ventulan/devjoe-showcase-studio/src/lib/uploadUtils.ts))**
   - Unified upload interface
   - Automatic selection of upload method
   - File validation and preprocessing

## Upload Flow

### 1. Small Files (< 10MB)
- Direct upload via presigned URL
- Fast and efficient
- Minimal overhead

### 2. Medium Files (10MB - 50MB)
- Direct upload to R2 via presigned URL
- Progress tracking with XMLHttpRequest

### 3. Large Files (> 50MB)
- Multipart upload with parallel processing
- Automatic chunking (10MB parts)
- Concurrent uploads (3 parts at a time)
- Progress tracking per part

## API Endpoints

### `/api/upload-to-r2/initiate-multipart`
- **Method**: POST
- **Purpose**: Start a multipart upload session
- **Request Body**:
  ```json
  {
    "fileName": "videos/uploads/123456789_sample.mp4",
    "contentType": "video/mp4"
  }
  ```
- **Response**:
  ```json
  {
    "uploadId": "abcd1234-ef56-7890-ghij-klmnopqrstuv"
  }
  ```

### `/api/upload-to-r2/upload-part`
- **Method**: POST
- **Purpose**: Get presigned URL for uploading a part
- **Request Body**:
  ```json
  {
    "fileName": "videos/uploads/123456789_sample.mp4",
    "uploadId": "abcd1234-ef56-7890-ghij-klmnopqrstuv",
    "partNumber": 1
  }
  ```
- **Response**:
  ```json
  {
    "url": "https://presigned-url-for-part-upload"
  }
  ```

### `/api/upload-to-r2/complete-multipart`
- **Method**: POST
- **Purpose**: Finalize multipart upload
- **Request Body**:
  ```json
  {
    "fileName": "videos/uploads/123456789_sample.mp4",
    "uploadId": "abcd1234-ef56-7890-ghij-klmnopqrstuv",
    "parts": [
      {
        "partNumber": 1,
        "etag": "\"abc123def456\""
      },
      {
        "partNumber": 2,
        "etag": "\"ghi789jkl012\""
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "publicUrl": "https://public-url-to-file",
    "location": "https://r2-location-url"
  }
  ```

### `/api/upload-to-r2/abort-multipart`
- **Method**: POST
- **Purpose**: Cancel multipart upload and clean up resources
- **Request Body**:
  ```json
  {
    "fileName": "videos/uploads/123456789_sample.mp4",
    "uploadId": "abcd1234-ef56-7890-ghij-klmnopqrstuv"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Multipart upload aborted successfully"
  }
  ```

## Implementation Details

### Frontend Implementation

The frontend handles the orchestration of multipart uploads:

1. **Initiation**: Request upload ID from backend
2. **Chunking**: Split file into 10MB parts
3. **Parallel Upload**: Upload 3 parts concurrently
4. **Tracking**: Monitor progress and update UI
5. **Completion**: Send part list to backend for finalization

### Backend Implementation

The backend securely handles R2 API interactions:

1. **Authentication**: Uses environment variables for R2 credentials
2. **Presigning**: Generates time-limited URLs for direct uploads
3. **State Management**: Tracks multipart upload sessions
4. **Resource Cleanup**: Aborts failed uploads to prevent storage leaks

## Error Handling

### Network Failures
- Automatic retry for individual parts
- Resume capability from last successful part
- Graceful degradation to direct upload if needed

### Validation Errors
- File size limits enforced (500MB maximum)
- Content type validation
- Clear error messages for users

### Resource Management
- Automatic cleanup of failed multipart uploads
- Timeout handling for abandoned sessions

## Testing Steps

### Manual Testing

1. **Small File Test** (< 10MB)
   - Upload a small video or image
   - Verify direct upload completes successfully
   - Check file is accessible via public URL

2. **Medium File Test** (10MB - 50MB)
   - Upload a medium-sized file
   - Verify progress tracking works
   - Confirm file integrity

3. **Large File Test** (> 50MB)
   - Upload a large video file (100MB+)
   - Monitor progress updates
   - Verify multipart upload completes
   - Test pause/resume functionality

### Automated Testing

1. **Unit Tests**
   - File validation functions
   - Progress calculation accuracy
   - Error handling scenarios

2. **Integration Tests**
   - End-to-end upload flows
   - Backend API responses
   - R2 integration verification

## Performance Optimization

### Memory Usage
- Streaming uploads avoid loading entire files into memory
- Chunked processing maintains consistent memory footprint
- Browser garbage collection optimization

### Bandwidth Utilization
- Parallel part uploads maximize connection usage
- Adaptive chunk sizing based on network conditions
- Connection pooling for efficient resource use

### User Experience
- Real-time progress updates
- Estimated time remaining
- Responsive UI during uploads

## Security Considerations

### Credential Protection
- R2 credentials never exposed to client
- Presigned URLs expire after 15 minutes
- Server-side validation of all requests

### File Validation
- Content type verification
- File size limits enforced
- Malicious file detection

### Access Control
- Row-level security in Supabase
- Private bucket configuration
- Signed URLs for secure access

## Troubleshooting

### Common Issues

1. **Upload Stalls**
   - Check network connectivity
   - Verify R2 credentials are configured
   - Review browser console for errors

2. **Permission Errors**
   - Confirm R2 bucket permissions
   - Verify environment variables
   - Check CORS configuration

3. **Performance Problems**
   - Adjust chunk size based on connection speed
   - Modify concurrent upload limit
   - Monitor R2 metrics in Cloudflare dashboard

### Debugging Tips

1. **Enable Logging**
   - Set verbose logging in development
   - Monitor browser network tab
   - Check backend logs for errors

2. **Test with Sample Files**
   - Use files of varying sizes
   - Test different content types
   - Validate edge cases

## Future Enhancements

### Planned Features
- Resume interrupted uploads
- Background upload queue
- Multiple file upload support
- Upload speed optimization

### Scalability Improvements
- Dynamic chunk sizing
- Adaptive concurrency limits
- CDN integration for faster downloads

## Conclusion

The R2 multipart upload implementation provides a robust solution for handling large file uploads while maintaining excellent user experience and system reliability. The modular design allows for easy maintenance and future enhancements.