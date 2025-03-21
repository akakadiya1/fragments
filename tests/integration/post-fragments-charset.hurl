# 1. Authenticated POST request with charset in Content-Type
POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1
`This is a fragment with charset!`

# Expect a 201 Created response
HTTP/1.1 201
[Asserts]
# The Location header should be correctly formatted
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
# UUID format for fragment ID
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
# Owner ID should be a hex-encoded string
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
# Ensure created and updated timestamps exist
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
# Confirm the fragment type includes charset
jsonpath "$.fragment.type" == "text/plain; charset=utf-8"
# Check the size of the fragment data
jsonpath "$.fragment.size" == 32  # Length of 'This is a fragment with charset!'

# Capture the Location URL into a variable named `url`
[Captures]
url: header "Location"

# 2. Try to GET the fragment we just posted by its URL
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
Content-Length: 32
[Asserts]
body == "This is a fragment with charset!"
