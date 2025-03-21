# tests/integration/post-fragments-unsupported-type.hurl
# Attempt to POST a fragment with an unsupported Content-Type
POST http://localhost:8080/v1/fragments
# Unsupported Content-Type
Content-Type: application/unsupported
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Body of the request
`This is an unsupported fragment!`

# Expect a 415 response
HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.message" == "Unsupported Media Type"
