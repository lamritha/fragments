# lab-9-s3.hurl
# 1. POST a new text fragment as an authorized user
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`Hello S3!`

# 2. Confirm 201 and capture the Location header
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
[Captures]
url: header "Location"

# 3. GET the fragment we just created
GET {{url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# 4. Confirm 200, correct type and body
HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "Hello S3!"

# 5. DELETE the fragment
DELETE {{url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# 6. Confirm 200
HTTP/1.1 200

# 7. Try to GET the fragment again
GET {{url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# 8. Confirm 404 since it should be deleted
HTTP/1.1 404
