# 1. POST a new JSON fragment to http://localhost:8080 as an authorized user.
# The fragment's body should be the JSON value, { "service": "DynamoDB" }.
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
{
  "service": "DynamoDB"
}

# 2. Confirm that the server returns a 201, and capture the Location header value and fragment ID
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 27  # Length of JSON body
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# 3. GET the fragment metadata using the captured URL as an authorized user.
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1
# Confirm that the server returns a 200 and the metadata matches expectations.
HTTP/1.1 200
[Asserts]
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 27

# 4. POST a second Markdown fragment to http://localhost:8080 as the same authorized user.
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`DynamoDB is **great**.`

# 5. Confirm that the server returns a 201, and capture the Location and fragment ID
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22  # Length of Markdown body
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 6. GET the second fragment metadata using the captured URL as an authorized user.
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1
# Confirm that the server returns a 200 and the metadata matches expectations.
HTTP/1.1 200
[Asserts]
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22

# 7. GET all fragments for the user (IDs only, no expansion).
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1
# Confirm that both fragment IDs are in the list.
HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"

# 8. DELETE the first fragment.
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 9. Confirm that the server returns a 200.
HTTP/1.1 204

# 10. Try to GET the first fragment again.
GET {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 11. Confirm that the server returns a 404.
HTTP/1.1 404
[Asserts]
jsonpath "$.error" == "Fragment not found"

# 12. GET all fragments for the user again.
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1
# Confirm that the first fragment ID is no longer in the list but the second still is.
HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" not contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"
