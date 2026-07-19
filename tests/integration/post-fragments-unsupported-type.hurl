# Confirm that posting an unsupported Content-Type produces a 415 error
POST http://localhost:8080/v1/fragments
Content-Type: application/msword
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`some data`

HTTP/1.1 415
