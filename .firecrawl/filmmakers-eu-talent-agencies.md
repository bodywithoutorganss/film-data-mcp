[Skip to main content](https://api.filmmakers.eu/talent-agencies#__docusaurus_skipToContent_fallback)

[![Filmmakers Logo](https://api.filmmakers.eu/img/logo.svg)](https://api.filmmakers.eu/)

[GitHub repository](https://github.com/denkungsart/filmmakers-api)

Search`` `K`

- [Getting Started](https://api.filmmakers.eu/talent-agencies#)

- [API Reference](https://api.filmmakers.eu/api-reference)
- [Core Concepts](https://api.filmmakers.eu/talent-agencies#)

- [Resources](https://api.filmmakers.eu/talent-agencies#)

  - [Attributes](https://api.filmmakers.eu/attributes)
  - [Actor Profiles](https://api.filmmakers.eu/actor-profiles)
  - [Crew Profiles](https://api.filmmakers.eu/crew-profiles)
  - [Talent Agencies](https://api.filmmakers.eu/talent-agencies)
  - [Blog Posts](https://api.filmmakers.eu/blog-posts)
  - [Showreels](https://api.filmmakers.eu/showreels)
  - [Showreel Media](https://api.filmmakers.eu/showreel-media)
  - [Messages](https://api.filmmakers.eu/messages)
  - [Casting Calls](https://api.filmmakers.eu/casting-calls)
- [Changelog](https://api.filmmakers.eu/changelog)

- [Home page](https://api.filmmakers.eu/)
- Resources
- Talent Agencies

On this page

# Talent Agencies

## Get Talent Agency Data [​](https://api.filmmakers.eu/talent-agencies\#get-talent-agency-data "Direct link to Get Talent Agency Data")

- cURL
- JavaScript (Fetch)
- PHP (cURL)
- Ruby (Net::HTTP)

```shell
curl "https://www.filmmakers.eu/api/v1/talent_agencies/{id}" \
  -H "Authorization: Token token=API_KEY"
```

```javascript
fetch('https://www.filmmakers.eu/api/v1/talent_agencies/{id}', {
  method: 'GET',
  headers: {
    'Authorization': 'Token token=API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

```php
<?php
$talentAgencyId = '{id}'; // Replace with the actual talent agency ID
$apiKey = 'API_KEY'; // Replace with your actual API key
$url = 'https://www.filmmakers.eu/api/v1/talent_agencies/' . $talentAgencyId;

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
  'Authorization: Token token=' . $apiKey
));

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo 'cURL Error: ' . curl_error($ch);
} else {
    echo $response;
    // For further processing, you might want to decode the JSON:
    // $data = json_decode($response, true);
    // var_dump($data);
}

curl_close($ch);
?>
```

```ruby
require 'net/http'
require 'json'

talent_agency_id = '{id}' # Replace with the actual talent agency ID
api_key = 'API_KEY' # Replace with your actual API key
uri = URI("https://www.filmmakers.eu/api/v1/talent_agencies/#{talent_agency_id}")

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Token token=#{api_key}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

data = JSON.parse(response.body)
puts data
```

Replace `{id}` with the ID of the talent agency you want to retrieve.

##### Example Response [​](https://api.filmmakers.eu/talent-agencies\#example-response "Direct link to Example Response")

```json
{
  "id": 1,
  "name": "Example agency",
  "short_name": "Agency",
  "homepage_url": "https://www.example.com",
  "filmmakers_url": "https://www.filmmakers.eu/agents/example-agency",
  "imdb_link": "https://pro.imdb.com/company/co0000001",
  "imdb_id": "co0000001",
  "showreel_url": "https://www.example.com/showreel",
  "facebook_page": "my-facebook-page",
  "instagram_username": "myinstaprofile",
  "public_email": "info@example.com",
  "picture_url": "https://imgproxy.filmmakers.eu/bf042068-c6ac-11ee-b970-a34dadd10171.jpg",
  "address": {
    "city": "Mainz",
    "country": "DE",
    "fax": null,
    "line1": "Wallstr. 11",
    "line2": "",
    "phone": "49613163691950",
    "zipcode": "55122"
  },
  "employees": [\
    {\
      "id": 1,\
      "first_name": "John",\
      "last_name": "Doe",\
      "phone": "49613163691950",\
      "email": "agent@example.com",\
      "role": "agent",\
      "function": null,\
      "instagram_username": "mypersonalprofile",\
      "imdb_link": "https://www.imdb.com/name/nm1234567",\
      "picture_url": "https://imgproxy.filmmakers.eu/bfa9eb4c-c6ac-11ee-9015-f30db07efa43.jpg",\
      "about_me": "This is a text about me",\
      "about_me_html": "<div>This is a text about me</div>"\
    }\
  ],
  "associations": [\
    "vda"\
  ],
  "about_me": "A text about our agency.",
  "about_me_html": "<div>A text about our agency.</div>"
}
```

This endpoint retrieves a specific talent agency.

### HTTP Request [​](https://api.filmmakers.eu/talent-agencies\#http-request "Direct link to HTTP Request")

`GET https://www.filmmakers.eu/api/v1/talent_agencies/<ID>`

### URL Parameters [​](https://api.filmmakers.eu/talent-agencies\#url-parameters "Direct link to URL Parameters")

| Parameter | Description |
| --- | --- |
| ID | The ID of the talent agency to retrieve |

### Response Fields [​](https://api.filmmakers.eu/talent-agencies\#response-fields "Direct link to Response Fields")

| Field | Type | Description |
| --- | --- | --- |
| associations | array of strings | Possible values are: `pma`, `sfaal`, `vda` |
| about\_me | string | Returned as plain text (stripped of any rich text formatting). This field is localized. If the `locale` query parameter is not provided, the API attempts to return the English (`en`) version of `about_me`. To request the `about_me` text in a specific language, use the `locale` query parameter (e.g., `?locale=de`). If the `about_me` content for the requested locale is not available, it will return null. |
| about\_me\_html | string | Returns an HTML version of `about_me` with **HTML markup**. Content is automatically sanitized. Allowed HTML tags include `a, b, br, div, em, h1, h2, h3, img, li, ol, p, strong, ul` and others. |
| employees\[\].about\_me | string | Returned as plain text (stripped of any rich text formatting). This field is localized. If the `locale` query parameter is not provided, the API attempts to return the English (`en`) version of `about_me`. To request the `about_me` text in a specific language, use the `locale` query parameter (e.g., `?locale=de`). If the `about_me` content for the requested locale is not available, it will return null. |

See the example response above for an overview of included fields.

[Edit this page](https://github.com/denkungsart/filmmakers-api/tree/main/docs/talent-agencies.md)

[Previous\\
\\
Crew Profiles](https://api.filmmakers.eu/crew-profiles) [Next\\
\\
Blog Posts](https://api.filmmakers.eu/blog-posts)

- [Get Talent Agency Data](https://api.filmmakers.eu/talent-agencies#get-talent-agency-data)
  - [HTTP Request](https://api.filmmakers.eu/talent-agencies#http-request)
  - [URL Parameters](https://api.filmmakers.eu/talent-agencies#url-parameters)
  - [Response Fields](https://api.filmmakers.eu/talent-agencies#response-fields)

Docs

- [API Reference](https://api.filmmakers.eu/)

Community

- [Contact Support](https://www.filmmakers.eu/contact/new)

More

- [Back to Filmmakers](https://www.filmmakers.eu/)
- [GitHub](https://github.com/denkungsart/filmmakers-api)

Copyright © 2026 Filmmakers. Built with Docusaurus.