# 1. Try to post a json fragment
# Creates a new fragment with JSON content
POST http://localhost:8080/v1/fragments
Content-Type: application/json

# Basic authentication credentials for user1
[BasicAuth]
user1@email.com:password1

# The actual content being sent as a JSON fragment
```
{
  "key": "value"
}
```

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
jsonpath "$.fragment.type" == "application/json"

# Save the Location header to use in the next request
[Captures]
url: header "Location"

# 2. Get the fragment in YAML format
# Converts and retrieves the JSON fragment as YAML
GET {{url}}/yaml
[BasicAuth]
user1@email.com:password1

# Expect a 200 OK response
HTTP 200

# Ensure the YAML output is correct
[Asserts]
body == "key: value\n"
