# R2 Upload QA Checklist

## Overview

This checklist ensures the R2 multipart upload system works correctly for files of various sizes. Tests should be performed for 100MB, 500MB, and 1GB files to validate functionality, performance, and reliability.

## Pre-Testing Setup

### Environment Configuration
- [ ] R2 credentials configured in environment variables
- [ ] VITE_R2_ENDPOINT set correctly
- [ ] VITE_R2_ACCESS_KEY_ID set correctly
- [ ] VITE_R2_SECRET_ACCESS_KEY set correctly
- [ ] VITE_R2_BUCKET_NAME set correctly
- [ ] VITE_R2_PUBLIC_URL set correctly
- [ ] Application deployed and accessible

### Test Data Preparation
- [ ] Create 100MB test file (video or binary)
- [ ] Create 500MB test file (video or binary)
- [ ] Create 1GB test file (video or binary)
- [ ] Prepare sample files < 10MB for baseline testing
- [ ] Prepare sample files 10MB-50MB for medium file testing

## Test Scenarios

### 1. Small File Uploads (< 10MB)
- [ ] File uploads successfully using direct method
- [ ] Progress bar shows accurate upload percentage
- [ ] File is accessible via returned public URL
- [ ] Upload completes within reasonable time (< 10 seconds)
- [ ] No errors in browser console
- [ ] No errors in backend logs

### 2. Medium File Uploads (10MB - 50MB)
- [ ] File uploads successfully using direct R2 method
- [ ] Progress updates are smooth and regular
- [ ] Upload speed is reasonable (dependent on connection)
- [ ] File integrity is maintained
- [ ] Public URL is correctly generated
- [ ] Memory usage remains stable during upload

### 3. Large File Uploads (> 50MB)

#### 100MB File Tests
- [ ] File uploads successfully using multipart method
- [ ] Upload is split into appropriate number of parts (10 parts for 10MB chunks)
- [ ] 3 parts upload concurrently as expected
- [ ] Progress bar accurately reflects upload status
- [ ] Upload completes without timeout errors
- [ ] File is accessible and playable (if video)
- [ ] No orphaned multipart uploads in R2 bucket
- [ ] Upload time is reasonable (typically 1-5 minutes depending on connection)

#### 500MB File Tests
- [ ] File uploads successfully using multipart method
- [ ] Upload is split into appropriate number of parts (50 parts for 10MB chunks)
- [ ] Concurrent uploads work correctly
- [ ] Memory usage stays constant throughout upload
- [ ] Progress updates remain responsive
- [ ] Upload completes without browser crashes
- [ ] File integrity is verified
- [ ] Upload time is reasonable (typically 5-15 minutes depending on connection)

#### 1GB File Tests
- [ ] File uploads successfully using multipart method
- [ ] Upload is split into appropriate number of parts (100 parts for 10MB chunks)
- [ ] System handles large number of parts correctly
- [ ] Browser remains responsive during upload
- [ ] Progress tracking works for entire duration
- [ ] Upload completes without network timeouts
- [ ] File is accessible and usable after upload
- [ ] No resource exhaustion on client or server

## Error Handling Tests

### Network Interruptions
- [ ] Upload resumes correctly after brief disconnection
- [ ] Partial uploads are properly cleaned up
- [ ] Error messages are user-friendly
- [ ] System recovers gracefully from network errors

### File Validation
- [ ] Files > 500MB are rejected with clear error message
- [ ] Invalid file types are rejected
- [ ] Zero-byte files are handled appropriately
- [ ] Files with special characters in names upload correctly

### Resource Management
- [ ] Failed uploads clean up temporary resources
- [ ] Orphaned multipart uploads are minimized
- [ ] Memory consumption remains stable
- [ ] Browser tab doesn't crash during large uploads

## Performance Tests

### Upload Speed
- [ ] 100MB file uploads in < 5 minutes on average connection
- [ ] 500MB file uploads in < 20 minutes on average connection
- [ ] 1GB file uploads in < 40 minutes on average connection
- [ ] Upload speeds are consistent throughout process

### Browser Responsiveness
- [ ] UI remains interactive during uploads
- [ ] Other browser tabs are unaffected
- [ ] Page scrolling works during upload
- [ ] No freezing or hanging during upload process

### Concurrent Operations
- [ ] Multiple simultaneous uploads work correctly
- [ ] Bandwidth is shared appropriately between uploads
- [ ] Progress tracking is accurate for each upload
- [ ] Completion notifications appear for each file

## Security Tests

### Credential Security
- [ ] R2 credentials are not exposed in client code
- [ ] Presigned URLs expire after 15 minutes
- [ ] Unauthorized access to upload endpoints is blocked
- [ ] CORS policies are properly configured

### File Validation
- [ ] Malicious file types are rejected
- [ ] File extensions match content types
- [ ] Oversized files are rejected before upload begins
- [ ] Filenames are sanitized to prevent path traversal

## Cross-Browser Compatibility

### Modern Browsers
- [ ] Chrome - All upload sizes work correctly
- [ ] Firefox - All upload sizes work correctly
- [ ] Safari - All upload sizes work correctly
- [ ] Edge - All upload sizes work correctly

### Mobile Browsers
- [ ] iOS Safari - Uploads work on mobile devices
- [ ] Android Chrome - Uploads work on mobile devices
- [ ] Mobile progress tracking is responsive
- [ ] Mobile uploads complete successfully

## User Experience Tests

### Progress Indicators
- [ ] Progress bar fills smoothly
- [ ] Percentage counter is accurate
- [ ] Upload speed is displayed (optional)
- [ ] Time remaining estimate is reasonable

### Error Messages
- [ ] Network errors show helpful messages
- [ ] File size errors explain limits clearly
- [ ] Authentication errors guide users to solutions
- [ ] Technical errors are logged but user messages are friendly

### Notifications
- [ ] Upload start notification appears
- [ ] Upload completion notification appears
- [ ] Error notifications are prominent and clear
- [ ] Success notifications include file access link

## Post-Upload Verification

### File Integrity
- [ ] Uploaded files match original checksums
- [ ] Video files play correctly in browser
- [ ] Image files display without corruption
- [ ] Document files open and are readable

### Metadata
- [ ] File names are preserved
- [ ] File types are correctly identified
- [ ] Upload timestamps are accurate
- [ ] File sizes match originals

### Accessibility
- [ ] Public URLs are correctly formatted
- [ ] Files are publicly accessible
- [ ] CDN delivery works if configured
- [ ] Download speeds are reasonable

## Stress Tests

### High Concurrency
- [ ] 5 simultaneous uploads complete successfully
- [ ] System resources are managed efficiently
- [ ] No upload failures due to concurrency
- [ ] Progress tracking remains accurate

### Extended Sessions
- [ ] Uploads work after browser has been open for hours
- [ ] Session timeouts don't interrupt uploads
- [ ] Memory leaks are not detected
- [ ] Performance remains consistent over time

## Recovery Tests

### Browser Crashes
- [ ] Uploads can be restarted after browser crash
- [ ] Partial progress is not lost unnecessarily
- [ ] System cleans up after crashed uploads
- [ ] User can resume interrupted uploads

### Server Restarts
- [ ] Backend restarts don't affect ongoing uploads
- [ ] New uploads work after server restart
- [ ] Orphaned resources are cleaned up
- [ ] API availability is restored quickly

## Reporting

### Test Results Documentation
- [ ] Record upload times for each file size
- [ ] Document any errors encountered
- [ ] Note browser versions and platforms tested
- [ ] Capture screenshots of successful uploads

### Performance Metrics
- [ ] Average upload speed per file size
- [ ] Memory usage during uploads
- [ ] CPU utilization during uploads
- [ ] Network bandwidth utilization

### Issue Tracking
- [ ] Log all failed test cases
- [ ] Include steps to reproduce failures
- [ ] Note frequency of intermittent issues
- [ ] Prioritize issues by impact and severity

## Sign-off

### QA Approval
- [ ] All critical tests pass
- [ ] No high-priority issues remain
- [ ] Performance meets requirements
- [ ] Security measures are effective

### Production Readiness
- [ ] System is ready for production deployment
- [ ] Monitoring is in place for uploads
- [ ] Rollback plan is documented
- [ ] Support team is trained on new features