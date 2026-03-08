[Skip to main content](https://api.filmmakers.eu/crew-profiles#__docusaurus_skipToContent_fallback)

[![Filmmakers Logo](https://api.filmmakers.eu/img/logo.svg)](https://api.filmmakers.eu/)

[GitHub repository](https://github.com/denkungsart/filmmakers-api)

Search`` `K`

- [Getting Started](https://api.filmmakers.eu/crew-profiles#)

- [API Reference](https://api.filmmakers.eu/api-reference)
- [Core Concepts](https://api.filmmakers.eu/crew-profiles#)

- [Resources](https://api.filmmakers.eu/crew-profiles#)

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
- Crew Profiles

On this page

# Crew Profiles

## Get All Crew Profiles [​](https://api.filmmakers.eu/crew-profiles\#get-all-crew-profiles "Direct link to Get All Crew Profiles")

Here is an example request:

- cURL
- JavaScript (Fetch)
- PHP (cURL)
- Ruby (Net::HTTP)

```shell
curl "https://www.filmmakers.eu/api/v1/crew_profiles" \
  -H "Authorization: Token token=API_KEY"
```

```javascript
fetch('https://www.filmmakers.eu/api/v1/crew_profiles', {
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
$apiKey = 'API_KEY'; // Replace with your actual API key
$url = 'https://www.filmmakers.eu/api/v1/crew_profiles';

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

api_key = 'API_KEY' # Replace with your actual API key
uri = URI('https://www.filmmakers.eu/api/v1/crew_profiles')

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Token token=#{api_key}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

data = JSON.parse(response.body)
puts data
```

##### Example Response [​](https://api.filmmakers.eu/crew-profiles\#example-response "Direct link to Example Response")

```json
[\
  {\
    "id": 1,\
    "name": "John Doe",\
    "gender": "m"\
  },\
  {\
    "id": 2,\
    "name": "Jane Doe",\
    "gender": "f"\
  }\
]
```

This endpoint retrieves all crew profiles available with the access rights of the API key. Most of the time, it is scoped to a talent agency.

### HTTP Request [​](https://api.filmmakers.eu/crew-profiles\#http-request "Direct link to HTTP Request")

`GET https://www.filmmakers.eu/api/v1/crew_profiles`

### Query Parameters [​](https://api.filmmakers.eu/crew-profiles\#query-parameters "Direct link to Query Parameters")

| Parameter | Default | Description |
| --- | --- | --- |
| page | 1 | Page to display – see "Pagination" section |
| per\_page | 250 | Items per page – see "Pagination" section |
| gender | null | Allows filtering by gender values. Possible values are: `male`, `female`, `transgender_female`, `transgender_male`, `non_binary`, `custom`. Returned as `m`, `f`, or `i` in the JSON response (depending on internal mapping). |
| updated\_at\[gte\] | null | Allows filtering for profiles updated since the passed timestamp. Passed as an integer Unix timestamp. |
| q | null | Allows filtering by name. Uses trigram, so allows fuzzy & partial matches. |
| include\_picture | false | If set to `true`, the result will include the profile picture thumbnail in a field named `main_picture_url_tile`. |
| picture\_version | null | Can be set to `original`, `large`, `thumb`, or `thumb_large` to change the included picture version. The picture will be included in a field named `picture_url`. _(Only applies if `include_picture` is `true`.)_ |
| fields | name,gender | Can be used to modify the fields included in the response. Allowed fields are: `name`, `first_name`, `last_name`, `gender`, `professions`, `languages`, `representative`, `updated_at` |
| order | id | Changes the order of returned results. Allowed values: `id`, `name`, `last_name`. |
| direction | asc | Specifies the order direction of returned results. Possible values are: `asc` (ascending), `desc` (descending) |
| professions\[\] | null | Filter crew profiles by professions – allows passing multiple profession names using array form of the parameter, e.g., `professions[]=regie&professions[]=kamera`. Allowed values: `regie`, `autor`, `kamera`, `komponist`, `dramaturg`, `schnitt`. |

> **Note:**
>
> - Only visible showreels and vita entries are returned.
> - Pictures that are invisible or still processing are skipped.
> - The `representative` field is only present if the crew member is represented by a talent agency employee.
> - If a user requests a forbidden or unknown field in `fields`, it is ignored (not an error).

### Response Fields [​](https://api.filmmakers.eu/crew-profiles\#response-fields "Direct link to Response Fields")

| Field | Type | Description |
| --- | --- | --- |
| id | number | Unique ID of the crew profile |
| name | string | Full name of the crew member (usually first & last name) |
| gender | string | `f` for female, `m` for male, `i` for diverse |
| professions | array of strings | A list of professions, e.g., `["regie", "kamera"]` |
| main\_picture\_url\_tile | string | Profile picture URL (thumbnail version) if `include_picture` is set |
| picture\_url | string | Profile picture URL of the specified version if `picture_version` is set |
| picture\_copyright | string | Copyright information |
| representative | JSON Object | Contains "id" and "name" of the talent agency employee |
| about\_me | string | Returned as plain text (stripped of any rich text formatting). This field is localized. If the `locale` query parameter is not provided, the API attempts to return the English (`en`) version of `about_me`. To request the `about_me` text in a specific language, use the `locale` query parameter (e.g., `?locale=de`). If the `about_me` content for the requested locale is not available, it will return null. |
| about\_me\_html | string | Returns an HTML version of `about_me` with **HTML markup**. Content is automatically sanitized. Allowed HTML tags include `a, b, br, div, em, h1, h2, h3, img, li, ol, p, strong, ul` and others. |
| updated\_at | string | Format ISO 8601 |

* * *

## Get a Specific Crew Profile [​](https://api.filmmakers.eu/crew-profiles\#get-a-specific-crew-profile "Direct link to Get a Specific Crew Profile")

Example request:

- cURL
- JavaScript (Fetch)
- PHP (cURL)
- Ruby (Net::HTTP)

```shell
curl "https://www.filmmakers.eu/api/v1/crew_profiles/{id}" \
  -H "Authorization: Token token=API_KEY"
```

```javascript
fetch('https://www.filmmakers.eu/api/v1/crew_profiles/{id}', {
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
$crewProfileId = '{id}'; // Replace with the actual crew profile ID
$apiKey = 'API_KEY'; // Replace with your actual API key
$url = 'https://www.filmmakers.eu/api/v1/crew_profiles/' . $crewProfileId;

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

crew_profile_id = '{id}' # Replace with the actual crew profile ID
api_key = 'API_KEY' # Replace with your actual API key
uri = URI("https://www.filmmakers.eu/api/v1/crew_profiles/#{crew_profile_id}")

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Token token=#{api_key}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

data = JSON.parse(response.body)
puts data
```

Replace `{id}` with the ID of the crew profile you want to retrieve.

##### Example Response [​](https://api.filmmakers.eu/crew-profiles\#example-response-1 "Direct link to Example Response")

```json
{
  "id": 162,
  "first_name": "John",
  "last_name": "Doe",
  "year_of_birth": 1980,
  "place_of_birth": "Berlin",
  "professions": ["regie", "autor"],
  "nationalities": ["DE", "FR"],
  "languages": {
    "deutsch": "muttersprachlich",
    "englisch": "fliessend"
  },
  "accommodation_options": [\
    "Berlin",\
    "Köln"\
  ],
  "about_me": "This is a text about me.",
  "about_me_html": "<div>This is a text about me.</div>",
  "representative": {
    "id": 123,
    "name": "Jane Roe"
  },
  "talent_agency_id": 1,
  "pictures": [\
    {\
      "id": 140,\
      "copyright": "John Doe",\
      "url": "https://imgproxy.filmmakers.eu/production/abc.jpg",\
      "versions": {\
        "original": "https://imgproxy.filmmakers.eu/...",\
        "large": "https://imgproxy.filmmakers.eu/...",\
        "thumb": "https://imgproxy.filmmakers.eu/...",\
        "thumb_large": "https://imgproxy.filmmakers.eu/..."\
      },\
      "orientation": "portrait",\
      "dimensions": [50, 64],\
      "crop_coordinates": {\
        "x": 0,\
        "y": 36,\
        "w": 357,\
        "h": 357\
      },\
      "main_picture": true,\
      "year": 2020,\
      "recorded_at": "2020-12-23T18:16:52+00:00"\
    }\
  ],
  "external_showreels": [\
    "https://youtube.com/john-doe/video"\
  ],
  "showreels": [\
    {\
      "name": "My Showreel",\
      "url": "https://www.filmmakers.eu/crew/john-doe/showreels/15",\
      "type": "video"\
    }\
  ],
  "showreel_ids": [12345],
  "showreel_medium_ids": [123456],
  "vita": {
    "film": [\
      {\
        "name": "Sample Film",\
        "year_from": 2019,\
        "year_to": 2019\
      }\
    ],
    "television": [],
    "theatre": [],
    "award": []
  },
  "locations": [\
    {\
      "name": "Berlin",\
      "latitude": 52.52000659999999,\
      "longitude": 13.404954,\
      "place_id": "ChIJAVkDPzdOqEcRcDteW0YgIQQ",\
      "type": "place",\
      "country": "DE"\
    },\
    {\
      "name": "Cologne",\
      "latitude": 50.937531,\
      "longitude": 6.9602786,\
      "place_id": "ChIJ5S-raZElv0cR8HcqSvxgJwQ",\
      "type": "accommodation",\
      "country": "DE"\
    }\
  ],
  "homepage_url": "https://www.example.com",
  "agency_profile_url": "https://www.my-agency/my-profile",
  "imdb_link": "https://www.imdb.com/name/nm1234",
  "imdb_id": "nm1234",
  "facebook_page": "my-facebook-page",
  "instagram_username": "my-instagram-name",
  "wikipedia_url": "https://de.wikipedia.org/wiki/my-wikipedia-page",
  "country": "DE",
  "state": "DE-RP",
  "gender": "m",
  "updated_at": "2021-06-22T16:14:11.519+02:00"
}
```

This endpoint retrieves a specific crew profile.

### HTTP Request [​](https://api.filmmakers.eu/crew-profiles\#http-request-1 "Direct link to HTTP Request")

`GET https://www.filmmakers.eu/api/v1/crew_profiles/<ID>`

### URL Parameters [​](https://api.filmmakers.eu/crew-profiles\#url-parameters "Direct link to URL Parameters")

| Parameter | Description |
| --- | --- |
| ID | The ID of the crew profile to retrieve |

### Query Parameters [​](https://api.filmmakers.eu/crew-profiles\#query-parameters-1 "Direct link to Query Parameters")

| Parameter | Default | Description |
| --- | --- | --- |
| enum | null | If set to `translate`, attributes are translated if possible (e.g., gender will be `male` or `männlich` instead of `m`). Note that arrays and hashes will be joined to strings when translating. |
| locale | en | Translates attributes with closed lists. Possible values are: `en`, `de`, `fr`, `it`, `es`, `pl`, `ro`, `ru`, `tr`. Only has an effect if `enum` is set to `translate`. |

### Response Fields [​](https://api.filmmakers.eu/crew-profiles\#response-fields-1 "Direct link to Response Fields")

The JSON structure will include relevant crew-related fields similar to those shown above. Not all fields are guaranteed to appear in every profile, and additional fields may be added without notice. Important fields include:

- **id**: Unique ID of the crew profile
- **first\_name**, **last\_name**, **name**: Strings representing the person's name
- **gender**: `m`, `f`, or `i` in the default form; can be expanded/translated if `enum=translate` is set
- **professions**: Array of strings indicating the crew member’s areas of expertise (e.g., `["regie", "autor", "kamera"]`)
- **languages**: JSON object, e.g., `{ "deutsch": "muttersprachlich" }`
- **representative**: JSON object with `id` and `name` of the representing agent
- **talent\_agency\_id**: ID of the primary talent agency representing the crew member
- **pictures**: Array of JSON objects with information about each uploaded picture
- **showreels**, **showreel\_ids**, **showreel\_medium\_ids**: Showreels connected to the profile
- **vita**: Structured data about film/theatre/TV credits, awards, etc.
- **country**, **state**: Country and state codes (or translated values if `enum=translate` is used)
- **locations**: Array of places of residence (type: `place`) and housing options (type: `accommodation`). Places of residence are sorted on top.

[Edit this page](https://github.com/denkungsart/filmmakers-api/tree/main/docs/crew-profiles.md)

[Previous\\
\\
Actor Profiles](https://api.filmmakers.eu/actor-profiles) [Next\\
\\
Talent Agencies](https://api.filmmakers.eu/talent-agencies)

- [Get All Crew Profiles](https://api.filmmakers.eu/crew-profiles#get-all-crew-profiles)
  - [HTTP Request](https://api.filmmakers.eu/crew-profiles#http-request)
  - [Query Parameters](https://api.filmmakers.eu/crew-profiles#query-parameters)
  - [Response Fields](https://api.filmmakers.eu/crew-profiles#response-fields)
- [Get a Specific Crew Profile](https://api.filmmakers.eu/crew-profiles#get-a-specific-crew-profile)
  - [HTTP Request](https://api.filmmakers.eu/crew-profiles#http-request-1)
  - [URL Parameters](https://api.filmmakers.eu/crew-profiles#url-parameters)
  - [Query Parameters](https://api.filmmakers.eu/crew-profiles#query-parameters-1)
  - [Response Fields](https://api.filmmakers.eu/crew-profiles#response-fields-1)

Docs

- [API Reference](https://api.filmmakers.eu/)

Community

- [Contact Support](https://www.filmmakers.eu/contact/new)

More

- [Back to Filmmakers](https://www.filmmakers.eu/)
- [GitHub](https://github.com/denkungsart/filmmakers-api)

Copyright © 2026 Filmmakers. Built with Docusaurus.