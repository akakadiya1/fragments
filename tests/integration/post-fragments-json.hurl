# tests/integration/post-fragments-json.hurl
# Authenticated POST to /v1/fragments with JSON content
POST http://localhost:8080/v1/fragments
Content-Type: application/json
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# JSON body of the request
{
  "message": "Hello, world!",
  "count": 42
}

# We expect to get back an HTTP 201
HTTP/1.1 201
[Asserts]
# The Location header should have a valid fragment URL
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 47

# Capture the fragment's URL
[Captures]
url: header "Location"

# 2. Try to GET the fragment we just posted by its URL
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json
[Asserts]
jsonpath "$.message" == "Hello, world!"
jsonpath "$.count" == 42
