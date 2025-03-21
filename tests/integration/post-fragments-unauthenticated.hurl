# POST request without Authorization header
POST http://localhost:8080/v1/fragments
Content-Type: text/plain

`Unauthenticated request!`

# Expect a 401 Unauthorized response
HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
