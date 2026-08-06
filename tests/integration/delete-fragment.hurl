# delete-fragment.hurl
# Tests for DELETE /v1/fragments/:id

# 1. POST a new fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`Fragment to be deleted`

# 2. Confirm 201 and capture url and id
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
[Captures]
fragment_url: header "Location"
fragment_id: jsonpath "$.fragment.id"

# 3. GET fragment to confirm it exists
GET {{fragment_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
[Asserts]
body == "Fragment to be deleted"

# 4. DELETE the fragment
DELETE {{fragment_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# 5. Confirm 200
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# 6. Try to GET the deleted fragment — should return 404
GET {{fragment_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"

# 7. Try to DELETE again — should return 404
DELETE {{fragment_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 404
