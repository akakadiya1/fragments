# 1. Try to post a markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown

# Basic authentication credentials for user1
[BasicAuth]
user1@email.com:password1

# The actual content being sent as a Markdown fragment
`# Hello world!`

# Expect a 201 Created response upon successful creation
HTTP/1.1 201

# validate all the response info
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/markdown"

# Save the value of the Location header for use in the next request
[Captures]
url: header "Location"

# 2. Retrieve the fragment as HTML
# This tests whether the markdown content can be successfully rendered as HTML
GET {{url}}/html
[BasicAuth]
user1@email.com:password1

# Expect a 200 OK response
HTTP 200

# Confirm the body is the correct HTML rendering of the markdown
[Asserts]
body == "<h1>Hello world!</h1>\n"
