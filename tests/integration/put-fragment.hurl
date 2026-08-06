# put-fragment.hurl
# Tests for PUT /v1/fragments/:id

# 1. POST a new text fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`Hello, this is the original fragment`

# 2. Confirm 201 and capture id and url
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
[Captures]
fragment_url: header "Location"
fragment_id: jsonpath "$.fragment.id"
original_size: jsonpath "$.fragment.size"

# 3. GET the fragment to confirm original content
GET {{fragment_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
[Asserts]
body == "Hello, this is the original fragment"

# 4. PUT updated content
PUT {{fragment_url}}
Content-Type: text/plain
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`This is the updated fragment content`

# 5. Confirm 200 and updated metadata
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment_id}}
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 36

# 6. GET the fragment again to confirm updated content
GET {{fragment_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
[Asserts]
body == "This is the updated fragment content"

# 7. Try to PUT with wrong Content-Type — should return 400
PUT {{fragment_url}}
Content-Type: text/markdown
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`# This should fail`

HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
