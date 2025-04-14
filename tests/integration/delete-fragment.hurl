# 1. Create a plain text fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`This is a fragment to test delete functionality.`

HTTP/1.1 201

[Asserts]
header "Location" matches /^http:\/\/localhost:8080\/v1\/fragments\/[0-9a-fA-F-]+$/
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"

[Captures]
fragment_url: header "Location"

# 2. Get the fragment to ensure it was created
GET {{fragment_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain

[Asserts]
`This is a fragment to test delete functionality.`

# 3. Delete the fragment
DELETE {{fragment_url}}
[BasicAuth]
user1@email.com:password1

# Confirm that the server returns a 200.
HTTP/1.1 204

# Try to GET the first fragment again.
GET {{fragment_url}}
[BasicAuth]
user1@email.com:password1

# Confirm that the server returns a 404.
HTTP/1.1 404
[Asserts]
jsonpath "$.error" == "Fragment not found"
