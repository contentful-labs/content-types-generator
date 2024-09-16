# TS contentful content types generator

> A CLI to generate Typescript definitions based on [JSON export](https://github.com/contentful/contentful-cli/tree/master/docs/space/export) generated with [contentful CLI](https://github.com/contentful/contentful-cli).

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/cf-content-types-generator.svg)](https://npmjs.org/package/cf-content-types-generator)
[![Downloads/week](https://img.shields.io/npm/dw/cf-content-types-generator.svg)](https://npmjs.org/package/cf-content-types-generator)
[![License](https://img.shields.io/npm/l/cf-content-types-generator.svg)](https://github.com/contentful-userland/cf-content-types-generator/blob/master/package.json)
[![Coverage Status](https://coveralls.io/repos/github/contentful-userland/cf-content-types-generator/badge.svg)](https://coveralls.io/github/contentful-userland/cf-content-types-generator)

# Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Example](#example)
    - [Local](#local)
    - [Remote](#remote)
  - [Input](#input)
  - [Output](#output)
- [Renderer](#renderer)
  - [Default Renderer](#DefaultContentTypeRenderer)
  - [Localized Renderer](#LocalizedContentTypeRenderer)
  - [JSDoc Renderer](#JSDocRenderer)
  - [Type Guard Renderer](#TypeGuardRenderer)
  - [Response Type Renderer](#ResponseTypeRenderer)
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
  -X  --v10                      create contentful.js v10 types
  -r, --response                 add response types (only for v10 types)
  -m, --modifier                 add default modifier (only for v10 types)
  -l, --localized                add localized types
  -d, --jsdoc                    add JSDoc comments
  -g, --typeguard                add type guards
  -s, --spaceId=spaceId          space id
  -t, --token=token              management token
  -v, --version                  show CLI version
  -a, --host                     The Management API host

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
cf-content-types-generator path/to/exported/file.json -o path/to/target/out/directory
```

> existing directory content will be removed.

#### Remote

If no `file` arg provided, remote mode is enabled.
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
              "linkMimetypeGroup": ["image"]
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
              "nodes": {}
            },
            {
              "enabledMarks": [],
              "message": "Marks are not allowed"
            },
            {
              "enabledNodeTypes": [],
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
          "validations": []
        },
        {
          "id": "type",
          "name": "Type",
          "type": "Symbol",
          "required": false,
          "validations": [
            {
              "in": ["print", "drawing", "painting"],
              "message": "Hello - this is a custom error message."
            }
          ]
        },
        {
          "id": "preview",
          "name": "Preview",
          "type": "Array",
          "required": false,
          "validations": [],
          "items": {
            "type": "Link",
            "validations": [
              {
                "linkMimetypeGroup": ["image", "audio", "video"]
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
              "linkContentType": ["artist"]
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
import * as CFRichTextTypes from '@contentful/rich-text-types';
import { Entry, EntryFields } from 'contentful';

export interface TypeArtistFields {
  name: Contentful.EntryFields.Symbol;
  profilePicture?: Contentful.Asset;
  bio?: EntryFields.RichText;
}

export type TypeArtist = Entry<TypeArtistFields>;

export interface TypeArtworkFields {
  name: EntryFields.Symbol;
  type?: 'print' | 'drawing' | 'painting';
  preview?: Asset[];
  artist: Entry<TypeArtistFields>;
}

export type TypeArtwork = Entry<TypeArtworkFields>;
```

This all only works if you add the [`contentful`](https://www.npmjs.com/package/contentful) package to your target project to get all relevant type definitions.

# Renderer

Extend the default `BaseContentTypeRenderer` class, or implement the `ContentTypeRenderer` interface for custom rendering.

Relevant methods to override:

| Methods             | Description                                                                | Override                                                              |
| ------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `render`            | Enriches a `SourceFile` with all relevant nodes                            | To control content type rendering (you should know what you're doing) |
| `getContext`        | Returns new render context object                                          | To define custom type renderer and custom module name function        |
| `addDefaultImports` | Define set of default imports added to every file                          | To control default imported modules                                   |
| `renderField`       | Returns a `PropertySignatureStructure` representing a field property       | To control Field property rendering                                   |
| `renderFieldType`   | Returns a `string` representing a field type                               | To control field type rendering (recommended)                         |
| `renderEntry`       | Returns a `TypeAliasDeclarationStructure` representing an entry type alias | To control entry type alias rendering                                 |
| `renderEntryType`   | Returns a `string` representing an entry type                              | To control entry type rendering (recommended)                         |

> Table represents order of execution

Set content type renderers:

```typescript
import {
  CFDefinitionsBuilder,
  DefaultContentTypeRenderer,
  LocalizedContentTypeRenderer,
} from 'cf-content-types-generator';

const builder = new CFDefinitionsBuilder([
  new DefaultContentTypeRenderer(),
  new LocalizedContentTypeRenderer(),
]);
```

## DefaultContentTypeRenderer

A renderer to render type fields and entry definitions. For most scenarios, this renderer is sufficient.
If no custom renderers given, `CFDefinitionsBuilder` creates a `DefaultContentTypeRenderer` by default.

#### Example Usage

```typescript
import { CFDefinitionsBuilder, DefaultContentTypeRenderer } from 'cf-content-types-generator';

const builder = new CFDefinitionsBuilder([new DefaultContentTypeRenderer()]);
```

## V10ContentTypeRenderer

A renderer to render type fields and entry definitions compatible with contentful.js v10.

```typescript
import { CFDefinitionsBuilder, V10ContentTypeRenderer } from 'cf-content-types-generator';

const builder = new CFDefinitionsBuilder([new V10ContentTypeRenderer()]);
```

## LocalizedContentTypeRenderer

Add additional types for localized fields. It adds utility types to transform fields into localized fields for given locales
More details on the utility types can be found here: [Issue 121](https://github.com/contentful-userland/cf-content-types-generator/issues/121)
Note that these types are not needed when using `V10ContentTypeRenderer` as the v10 entry type already supports localization.

#### Example Usage

```typescript
import {
  CFDefinitionsBuilder,
  DefaultContentTypeRenderer,
  LocalizedContentTypeRenderer,
} from 'cf-content-types-generator';

const builder = new CFDefinitionsBuilder([
  new DefaultContentTypeRenderer(),
  new LocalizedContentTypeRenderer(),
]);
```

#### Example output

```typescript
export interface TypeCategoryFields {
  title: Contentful.EntryFields.Text;
  icon?: Contentful.Asset;
  categoryDescription?: Contentful.EntryFields.Text;
}

export type TypeCategory = Contentful.Entry<TypeCategoryFields>;

export type LocalizedTypeCategoryFields<Locales extends keyof any> = LocalizedFields<
  TypeCategoryFields,
  Locales
>;

export type LocalizedTypeCategory<Locales extends keyof any> = LocalizedEntry<
  TypeCategory,
  Locales
>;
```

#### Example output usage

```typescript
const localizedCategory: LocalizedTypeCategory<'DE-de' | 'En-en'> = {
  fields: {
    categoryDescription: {
      'DE-de': 'german description',
      'En-en': 'english description',
    },
  },
};
```

## JSDocRenderer

Adds [JSDoc](https://jsdoc.app/) Comments to every Entry type and Field type (created by the default renderer, or a renderer that creates the same entry and field type names). This renderer can be customized through [renderer options](src/renderer/type/js-doc-renderer.ts#L20).

JSDocContentTypeRenderer can only render comments for already rendered types. It's essential to add it after the default renderer, or any renderer that creates entry and field types based on the context moduleName resolution.

#### Example Usage

```typescript
import { CFDefinitionsBuilder, JsDocRenderer } from 'cf-content-types-generator';

const builder = new CFDefinitionsBuilder([new DefaultContentTypeRenderer(), new JsDocRenderer()]);
```

#### Example output

```typescript
import * as Contentful from 'contentful';
/**
 * Fields type definition for content type 'TypeAnimal'
 * @name TypeAnimalFields
 * @type {TypeAnimalFields}
 * @memberof TypeAnimal
 */
export interface TypeAnimalFields {
  /**
   * Field type definition for field 'bread' (Bread)
   * @name Bread
   * @localized false
   */
  bread: Contentful.EntryFields.Symbol;
}

/**
 * Entry type definition for content type 'animal' (Animal)
 * @name TypeAnimal
 * @type {TypeAnimal}
 */
export type TypeAnimal = Contentful.Entry<TypeAnimalFields>;
```

## TypeGuardRenderer

Adds type guard functions for every content type

#### Example Usage

```typescript
import {
  CFDefinitionsBuilder,
  DefaultContentTypeRenderer,
  TypeGuardRenderer,
} from 'cf-content-types-generator';

const builder = new CFDefinitionsBuilder([
  new DefaultContentTypeRenderer(),
  new TypeGuardRenderer(),
]);
```

#### Example output

```typescript
import { Entry, EntryFields } from 'contentful';
import type { WithContentTypeLink } from 'TypeGuardTypes';

export interface TypeAnimalFields {
  bread: EntryFields.Symbol;
}

export type TypeAnimal = Entry<TypeAnimalFields>;

export function isTypeAnimal(entry: WithContentTypeLink): entry is TypeAnimal {
  return entry.sys.contentType.sys.id === 'animal';
}
```

## V10TypeGuardRenderer

Adds type guard functions for every content type which are compatible with contentful.js v10.

#### Example Usage

```typescript
import {
  CFDefinitionsBuilder,
  V10ContentTypeRenderer,
  V10TypeGuardRenderer,
} from 'cf-content-types-generator';

const builder = new CFDefinitionsBuilder([
  new V10ContentTypeRenderer(),
  new V10TypeGuardRenderer(),
]);
```

#### Example output

```typescript
import type {
  ChainModifiers,
  Entry,
  EntryFieldTypes,
  EntrySkeletonType,
  LocaleCode,
} from 'contentful';

export interface TypeAnimalFields {
  bread?: EntryFieldTypes.Symbol;
}

export type TypeAnimalSkeleton = EntrySkeletonType<TypeAnimalFields, 'animal'>;
export type TypeAnimal<Modifiers extends ChainModifiers, Locales extends LocaleCode> = Entry<
  TypeAnimalSkeleton,
  Modifiers,
  Locales
>;

export function isTypeAnimal<Modifiers extends ChainModifiers, Locales extends LocaleCode>(
  entry: Entry<EntrySkeletonType, Modifiers, Locales>,
): entry is TypeAnimal<Modifiers, Locales> {
  return entry.sys.contentType.sys.id === 'animal';
}
```

## ResponseTypeRenderer

Adds response types for every content type which are compatible with contentful.js v10.

#### Example Usage

```typescript
import {
  CFDefinitionsBuilder,
  V10ContentTypeRenderer,
  ResponseTypeRenderer,
} from 'cf-content-types-generator';

const builder = new CFDefinitionsBuilder([
  new V10ContentTypeRenderer(),
  new ResponseTypeRenderer(),
]);
```

#### Example output

```typescript
import type {
  ChainModifiers,
  Entry,
  EntryFieldTypes,
  EntrySkeletonType,
  LocaleCode,
} from 'contentful';

export interface TypeAnimalFields {
  bread?: EntryFieldTypes.Symbol;
}

export type TypeAnimalSkeleton = EntrySkeletonType<TypeAnimalFields, 'animal'>;
export type TypeAnimal<Modifiers extends ChainModifiers, Locales extends LocaleCode> = Entry<
  TypeAnimalSkeleton,
  Modifiers,
  Locales
>;

export type TypeAnimalWithoutLinkResolutionResponse = TypeAnimal<'WITHOUT_LINK_RESOLUTION'>;
export type TypeAnimalWithoutUnresolvableLinksResponse = TypeAnimal<'WITHOUT_UNRESOLVABLE_LINKS'>;
export type TypeAnimalWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> =
  TypeAnimal<'WITH_ALL_LOCALES'>;
export type TypeAnimalWithAllLocalesAndWithoutLinkResolutionResponse<
  Locales extends LocaleCode = LocaleCode,
> = TypeAnimal<'WITH_ALL_LOCALES' | 'WITHOUT_LINK_RESOLUTION', Locales>;
export type TypeAnimalWithAllLocalesAndWithoutUnresolvableLinksResponse<
  Locales extends LocaleCode = LocaleCode,
> = TypeAnimal<'WITH_ALL_LOCALES' | 'WITHOUT_UNRESOLVABLE_LINKS', Locales>;
```

# Direct Usage

If you're not a CLI person, or you want to integrate it with your tooling workflow, you can also directly use the `CFDefinitionsBuilder` from `cf-definitions-builder.ts`

```typescript
import CFDefinitionsBuilder from 'cf-content-types-generator';

const stringContent = new CFDefinitionsBuilder()
  .appendType({
    name: 'My Entry',
    sys: {
      id: 'myEntry',
      type: 'ContentType',
    },
    fields: [
      {
        id: 'myField',
        name: 'My Field',
        type: 'Symbol',
        required: true,
        validations: [],
        disabled: false,
        localized: false,
        omitted: false,
      },
    ],
  })
  .toString();

console.log(stringContent);

// import { Entry, EntryFields } from "contentful";

//
// export interface TypeMyEntryFields {
//   myField: EntryFields.Symbol;
// }
//
// export type TypeMyEntry = Entry<TypeMyEntryFields>;
```

# Browser Usage

You can use `CFDefinitionsBuilder` also in a browser environment.

> Example: [TS Content Types Generator App](https://github.com/marcolink/cf-content-types-generator-app)
