[Developer](https://developer.imdb.com/?ref_=header)

[Documentation](https://developer.imdb.com/documentation/?ref_=header) [Contact Us](https://help.imdb.com/contact/developer/?ref_=devsite_header)

- Documentation
- Key Concepts

API Data Documentation

Overview
Getting Access to the API
API Key Concepts
Calling the API
Sample Queries
Title/Name
Box Office
Search

Bulk Data Documentation

Overview
Bulk Data Key Concepts
Data Dictionary
Names
Titles
Box Office
Meters
Parents Guide
GeoMeters
Querying In Athena
Creating Tables DDL

- Release Notes

# Getting Access to the API

## Prerequisites [![](https://developer.imdb.com/icons/anchorIcon.svg)](https://developer.imdb.com/documentation/api-documentation/getting-access/\#prerequisites)

To access the IMDb API, you will need the following:

- **An AWS Account** \- The IMDb API is exclusively available through [AWS Data Exchange](https://aws.amazon.com/marketplace/seller-profile?id=0af153a3-339f-48c2-8b42-3b9fa26d3367) and requires an AWS account to access GraphQL-backed API products. To create an AWS Account, follow the AWS instructions listed [here](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/).
- **AWS Access Keys** \- The AWS Access Keys are long-term credentials to authenticate you, so you can perform actions in an AWS account programmatically. Access Keys come in two parts: an Access Key ID and a Secret Access Key. To find out how to create an AWS Access Key, take a look at [this](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) documentation on AWS Access Keys.
- **(Optional) Enabling AWS Cost Explorer** \- Enabling AWS Cost Explorer is necessary to see your cost and usage of the IMDb API. To enable Cost Explorer please follow the AWS instructions listed [here](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-enable.html). You can also find more information on how to see your cost and usage [here](https://developer.imdb.com/documentation/api-documentation/key-concepts/?ref_=body#viewing-your-imdb-api-usage--cost).

## API Products [![](https://developer.imdb.com/icons/anchorIcon.svg)](https://developer.imdb.com/documentation/api-documentation/getting-access/\#api-products)

[**IMDb Essential Metadata for Movies/TV/OTT (API)** \\
\\
IMDb essential metadata for every movie, TV and OTT series, and video game title as well as performers and creators.\\
\\
- Extended title data\\
- IMDb Ratings\\
- Name Data](https://aws.amazon.com/marketplace/pp/prodview-wdqq4hg3bcbws)

[**IMDb and Box Office Mojo for Movies/TV/OTT (API)** \\
\\
Essential metadata package plus daily, weekend weekly, and lifetime box office grosses from Box Office Mojo.\\
\\
- Extended title data\\
- IMDb Ratings\\
- Name Data\\
- Box Office Performance Data](https://aws.amazon.com/marketplace/pp/prodview-nzspap6vaousm)

## Subscribe to the IMDb API [![](https://developer.imdb.com/icons/anchorIcon.svg)](https://developer.imdb.com/documentation/api-documentation/getting-access/\#subscribe-to-the-imdb-api)

Once you have satisfied the prerequisites, you can request an IMDb API trial. To do this:

1. Click the link of the API Product you would like to try out.
2. Click “Continue to subscribe”.
3. Sign into your AWS Account if prompted.
4. Review the product offer and subscription terms for accuracy and complete the subscription request by clicking “Send subscription request to provider”. Subscription requests will be processed by IMDb staff within five business days. Once approved, a notification email will be sent and the status updated under “ [Subscriptions requests](https://console.aws.amazon.com/dataexchange/home?region=us-east-1#/subscription-requests)”. Subscription details are located under “ [Subscriptions](https://console.aws.amazon.com/dataexchange/home?region=us-east-1#/subscriptions)”.

## Locate IDs and API Key [![](https://developer.imdb.com/icons/anchorIcon.svg)](https://developer.imdb.com/documentation/api-documentation/getting-access/\#locate-ids-and-api-key)

To access the API you will need the `Endpoint`, `API Key`, `data-set-id`, `revision-id`, and `asset-id` of your subscription. These are unique for each subscriptions.

### Locating the IDs [![](https://developer.imdb.com/icons/anchorIcon.svg)](https://developer.imdb.com/documentation/api-documentation/getting-access/\#locating-the-ids)

1. Under the “ [Entitled Data](https://console.aws.amazon.com/dataexchange/home?region=us-east-1#/entitled-data)” page, select the product you wish to access, go to the most recent revision, and then click the API asset under the revision.
2. Under the “Asset Overview” section, locate the details of the `Endpoint`, `data-set-id`, `revision-id`, and `asset-id` for the product. Make a note of these.

### Locating your API Key [![](https://developer.imdb.com/icons/anchorIcon.svg)](https://developer.imdb.com/documentation/api-documentation/getting-access/\#locating-your-api-key)

1. You can find your API key in an email from a member of IMDb staff.
2. Make a note of this API key.

## Call the API [![](https://developer.imdb.com/icons/anchorIcon.svg)](https://developer.imdb.com/documentation/api-documentation/getting-access/\#call-the-api)

Now that you’re subscribed to a product on AWS Data Exchange, access to an endpoint will be granted (`api-fulfill.dataexchange.us-east-1.amazonaws.com/v1`) and you can begin querying IMDb data sets. Check out the [Calling The API page](https://developer.imdb.com/documentation/api-documentation/calling-the-api/?ref_=body) to make some calls.

## [API Key Concepts](https://developer.imdb.com/documentation/api-documentation/key-concepts/?ref_=up_next)

Learn about the key concepts of the API before diving into how to make your own GraphQL queries

## Get started

Contact us to see how IMDb data can solve your customers needs.

[Contact Us](https://help.imdb.com/contact/developer/?ref_=devsite_footer)

- [Conditions of Use](https://www.imdb.com/conditions)
- [Privacy Policy](https://www.imdb.com/privacy)

© 1990-2026 by IMDb.com, Inc.