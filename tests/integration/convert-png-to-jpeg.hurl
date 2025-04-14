# 1. Post a image/png fragment
POST http://localhost:8080/v1/fragments
Content-Type: image/png

# Basic authentication credentials for user1
[BasicAuth]
user1@email.com:password1

# The actual content being sent as a png image fragment
file,test.png;

# Expect a 201 Created response upon successful creation
HTTP/1.1 201

# Validate response headers and JSON fields
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "image/png"

# Save the value of the Location header for use in the next request
[Captures]
url: header "Location"

# 2. Retrieve the fragment as jpeg
# This tests whether the png content can be successfully rendered as jpeg
GET {{url}}/jpg
[BasicAuth]
user1@email.com:password1

# Expect a 200 OK response
HTTP 200

# Confirm the body is the correct jpeg
[Asserts]
header "Content-Type" == "image/jpeg"
