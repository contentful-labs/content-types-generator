# TS contentful content types generator

> A CLI to generate Typescript definitions based on [JSON export](https://github.com/contentful/contentful-cli/tree/master/docs/space/export) generated with [contentful CLI](https://github.com/contentful/contentful-cli).

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/cf-content-types-generator.svg)](https://npmjs.org/package/cf-content-types-generator)
[![Downloads/week](https://img.shields.io/npm/dw/cf-content-types-generator.svg)](https://npmjs.org/package/cf-content-types-generator)
[![License](https://img.shields.io/npm/l/cf-content-types-generator.svg)](https://github.com/contentful-labs/cf-content-types-generator/blob/master/package.json)
![Tests](https://github.com/contentful-labs/cf-content-types-generator/workflows/Tests/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/contentful-labs/cf-content-types-generator/badge.svg)](https://coveralls.io/github/contentful-labs/cf-content-types-generator)

# Table of Contents
- [Installation](#installation)
- [Usage](#usage)
    - [Example](#example)
        - [Local](#local)
        - [Remote](#remote)
    - [Input](#input)
    - [Output](#output)
- [Renderer](#custom-renderer)
  - [Default Renderer](#DefaultContentTypeRenderer)
  - [Localized Renderer](#LocalizedContentTypeRenderer)
- [Direct Usage](#direct-usage)
- [Browser Usage](#browser-usage)

## Installation

```bash
npm install cf-content-types-generator
```

## Usage

```bash
Contentful Content Types (TS Definitions) Generator

USAGE
  $ cf-content-types-generator [FILE]

ARGUMENTS
  FILE  local export (.json)

OPTIONS
  -e, --environment=environment  environment
  -h, --help                     show CLI help
  -o, --out=out                  output directory
  -p, --preserve                 preserve output folder
  -l, --localized                add localized types
  -s, --spaceId=spaceId          space id
  -t, --token=token              management token
  -v, --version                  show CLI version
```

### Example

#### Local
Use a local `JSON` file to load `contentTypes`. Flags for `spaceId`, `token` and `environement` will be ignored.

**Will print result to console**
```bash
cf-content-types-generator path/to/exported/file.json
```
> in a real world scenario, you would pipe the result to a file.

**Will store resulting files in target directory**
```bash
cf-content-types-generator path/to/exported/file.json path/to/target/out/directory 
```
#### Remote
If no `file` arg provided, remote mode es enabled. 
`spaceId` and `token` flags need to be set.

```bash
cf-content-types-generator -s 2l3j7k267xxx  -t CFPAT-64FtZEIOruksuaE_Td0qBvHdELNWBCC0fZUWq1NFxxx
```


### Input
As input a [json file](https://github.com/contentful/contentful-cli/tree/master/docs/space/export#exported-data) with a `contentTypes` field is expected:

```json
{
  "contentTypes": [
    {
      "sys": {
        "id": "artist",
        "type": "ContentType"
      },
      "displayField": "name",
      "name": "Artist",
      "fields": [
        {
          "id": "name",
          "name": "Name",
          "type": "Symbol",
          "required": true,
          "validations": [
            {
              "unique": true
            }
          ]
        },
        {
          "id": "profilePicture",
          "name": "Profile Picture",
          "type": "Link",
          "required": false,
          "validations": [
            {
              "linkMimetypeGroup": [
                "image"
              ]
            }
          ],
          "linkType": "Asset"
        },
        {
          "id": "bio",
          "name": "Bio",
          "type": "RichText",
          "required": false,
          "validations": [
            {
              "nodes": {
              }
            },
            {
              "enabledMarks": [
              ],
              "message": "Marks are not allowed"
            },
            {
              "enabledNodeTypes": [
              ],
              "message": "Nodes are not allowed"
            }
          ]
        }
      ]
    },
    {
      "sys": {
        "id": "artwork",
        "type": "ContentType"
      },
      "displayField": "name",
      "name": "Artwork",
      "fields": [
        {
          "id": "name",
          "name": "Name",
          "type": "Symbol",
          "required": true,
          "validations": [
          ]
        },
        {
          "id": "type",
          "name": "Type",
          "type": "Symbol",
          "required": false,
          "validations": [
            {
              "in": [
                "print",
                "drawing",
                "painting"
              ],
              "message": "Hello - this is a custom error message."
            }
          ]
        },
        {
          "id": "preview",
          "name": "Preview",
          "type": "Array",
          "required": false,
          "validations": [
          ],
          "items": {
            "type": "Link",
            "validations": [
              {
                "linkMimetypeGroup": [
                  "image",
                  "audio",
                  "video"
                ]
              }
            ],
            "linkType": "Asset"
          }
        },
        {
          "id": "artist",
          "name": "Artist",
          "type": "Link",
          "required": true,
          "validations": [
            {
              "linkContentType": [
                "artist"
              ]
            }
          ],
          "linkType": "Entry"
        }
      ]
    }
  ]
}
```
> This example shows a subset of the actual payload provided by contentful's cli export command.

### Output 
```typescript
import * as CFRichTextTypes from "@contentful/rich-text-types";
import * as Contentful from "contentful";

export interface TypeArtistFields {
    name: Contentful.EntryFields.Symbol;
    profilePicture?: Contentful.Asset;
    bio?: CFRichTextTypes.Block | CFRichTextTypes.Inline;
}

export type TypeArtist = Contentful.Entry<TypeArtistFields>;

export interface TypeArtworkFields {
    name: Contentful.EntryFields.Symbol;
    type?: "print" | "drawing" | "painting";
    preview?: Contentful.Asset[];
    artist: Contentful.Entry<TypeArtistFields>;
}

export type TypeArtwork = Contentful.Entry<TypeArtworkFields>;
```
This all only works if you add the [`contentful`](https://www.npmjs.com/package/contentful) package to your target project to get all relevant type definitions.

# Renderer

Extend the default `BaseContentTypeRenderer` class, or implement the `ContentTypeRenderer` interface for custom rendering.

Relevant methods to override:

| Methods             | Description                                                  | Override                                                     |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `render`            | Enriches a `SourceFile` with all relevant nodes              | To control content type rendering (you should know what you're doing) |
| `getContext`        | Returns new render context object                            | To define custom type renderer and custom module name function |
| `addDefaultImports` | Define set of default imports added to every file            | To control default imported modules                          |
| `renderField`       | Returns a `PropertySignatureStructure` representing a field property | To control Field property rendering                          |
| `renderFieldType`   | Returns a `string` representing a field type                 | To control field type rendering (recommended)                |
| `renderEntry`       | Returns a `TypeAliasDeclarationStructure` representing an entry type alias | To control entry type alias rendering                        |
| `renderEntryType`   | Returns a `string` representing an entry type                | To control entry type rendering (recommended)                |

> Table represents order of execution

Set content type renderers:

```typescript
import CFDefinitionsBuilder from "cf-content-types-generator/lib/cf-definitions-builder";
import {DefaultContentTypeRenderer, LocalizedContentTypeRenderer} from 'cf-content-types-generator/lib/renderer/type';

const builder = new CFDefinitionsBuilder([
    new DefaultContentTypeRenderer(),
    new LocalizedContentTypeRenderer()
]); 
```

## DefaultContentTypeRenderer
A renderer to render type fields and entry definitions. For most scenarios, this renderer is sufficient. 
If no custom renderers given, `CFDefinitionsBuilder` creates a `DefaultContentTypeRenderer` by default.

## LocalizedContentTypeRenderer
Add additional types for localized fields. It adds utility types to transform fields into localized fields for given locales
More details on the utility types can be found here: [Issue 121](https://github.com/contentful-userland/cf-content-types-generator/issues/121)

#### Example output

```typescript
export interface TypeCategoryFields {
    title: Contentful.EntryFields.Text;
    icon?: Contentful.Asset;
    categoryDescription?: Contentful.EntryFields.Text;
}

export type TypeCategory = Contentful.Entry<TypeCategoryFields>;

export type LocalizedTypeCategoryFields<Locales extends keyof any> = LocalizedFields<TypeCategoryFields, Locales>;

export type LocalizedTypeCategory<Locales extends keyof any> = LocalizedEntry<TypeCategory, Locales>;
```

#### Example usage

```typescript
const localizedCategory: LocalizedTypeCategory<'DE-de' | 'En-en'> = {
    fields: {
        categoryDescription: {
            "DE-de": 'german description',
            "En-en": 'english description'
        }
    }
}
```


# Direct Usage

If you're not a CLI person, or you want to integrate it with your tooling workflow, you can also directly use the `CFDefinitionsBuilder` from `cf-definitions-builder.ts`

```typescript
import CFDefinitionsBuilder from "cf-content-types-generator/lib/cf-definitions-builder";

const stringContent = new CFDefinitionsBuilder()
    .appendType({
        id: "rootId",
        name: "Root Name",
        sys: {
            id: "sysId",
            type: "ContentType",
        }, fields: [{
            id: "myFieldId",
            type: "Symbol",
            required: true,
            validations: []            
        }]
    })
    .toString();
```

# Browser Usage
You can use `CFDefinitionsBuilder` also in a browser environment.
> Example: [TS Content Types Generator App](https://github.com/marcolink/cf-content-types-generator-app)

