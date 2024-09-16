import { ContentTypeField, ContentTypeFieldType } from 'contentful';

import { Project, ScriptTarget, SourceFile } from 'ts-morph';
import {
  CFContentType,
  V10ContentTypeRenderer,
  defaultRenderers,
  FieldRenderer,
  moduleFieldsName,
  moduleName,
  moduleSkeletonName,
  RenderContext,
  renderTypeGeneric,
} from '../../../src';
import stripIndent = require('strip-indent');

describe('The v10 content type renderer', () => {
  let project: Project;
  let testFile: SourceFile;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ScriptTarget.ES5,
        declaration: true,
      },
    });
    testFile = project.createSourceFile('test.ts');
  });

  it('adds import for skeleton type', () => {
    const renderer = new V10ContentTypeRenderer();

    const contentType: CFContentType = {
      name: 'unused-name',
      sys: {
        id: 'test',
        type: 'Symbol',
      },
      fields: [
        {
          id: 'linkFieldId',
          name: 'Linked entry Field',
          type: 'Link',
          localized: false,
          required: true,
          validations: [
            {
              linkContentType: ['linkedType'],
            },
          ],
          disabled: false,
          omitted: false,
          linkType: 'Entry',
        },
      ],
    };

    renderer.render(contentType, testFile);

    expect('\n' + testFile.getFullText()).toEqual(
      stripIndent(`
        import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
        import type { TypeLinkedTypeSkeleton } from "./TypeLinkedType";

        export interface TypeTestFields {
            linkFieldId: EntryFieldTypes.EntryLink<TypeLinkedTypeSkeleton>;
        }

        export type TypeTestSkeleton = EntrySkeletonType<TypeTestFields, "test">;
        export type TypeTest<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeTestSkeleton, Modifiers, Locales>;
        `),
    );
  });

  it('adds default modifier', () => {
    const renderer = new V10ContentTypeRenderer({ defaultModifier: 'WITHOUT_UNRESOLVABLE_LINKS' });

    const contentType: CFContentType = {
      name: 'unused-name',
      sys: {
        id: 'test',
        type: 'Symbol',
      },
      fields: [
        {
          id: 'linkFieldId',
          name: 'Linked entry Field',
          type: 'Link',
          localized: false,
          required: true,
          validations: [
            {
              linkContentType: ['linkedType'],
            },
          ],
          disabled: false,
          omitted: false,
          linkType: 'Entry',
        },
      ],
    };

    renderer.render(contentType, testFile);

    expect('\n' + testFile.getFullText()).toEqual(
      stripIndent(`
        import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
        import type { TypeLinkedTypeSkeleton } from "./TypeLinkedType";

        export interface TypeTestFields {
            linkFieldId: EntryFieldTypes.EntryLink<TypeLinkedTypeSkeleton>;
        }

        export type TypeTestSkeleton = EntrySkeletonType<TypeTestFields, "test">;
        export type TypeTest<Modifiers extends ChainModifiers = 'WITHOUT_UNRESOLVABLE_LINKS', Locales extends LocaleCode = LocaleCode> = Entry<TypeTestSkeleton, Modifiers, Locales>;
        `),
    );
  });
});

const symbolTypeRenderer = () => {
  return 'Test.Symbol';
};

describe('A derived content type renderer class', () => {
  let project: Project;
  let testFile: SourceFile;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ScriptTarget.ES5,
        declaration: true,
      },
    });
    testFile = project.createSourceFile('test.ts');
  });

  it('can return a custom field type renderer', () => {
    class DerivedContentTypeRenderer extends V10ContentTypeRenderer {
      public createContext(): RenderContext {
        return {
          moduleName,
          moduleFieldsName,
          moduleReferenceName: moduleSkeletonName,
          moduleSkeletonName,
          getFieldRenderer: <FType extends ContentTypeFieldType>(fieldType: FType) => {
            if (fieldType === 'Symbol') {
              return symbolTypeRenderer as FieldRenderer<FType>;
            }

            return defaultRenderers[fieldType] as FieldRenderer<FType>;
          },
          imports: new Set(),
        };
      }
    }

    const renderer = new DerivedContentTypeRenderer();

    const contentType: CFContentType = {
      name: 'unused-name',
      sys: {
        id: 'test',
        type: 'Symbol',
      },
      fields: [
        {
          id: 'field_id',
          name: 'field_name',
          disabled: false,
          localized: false,
          required: true,
          type: 'Symbol',
          omitted: false,
          validations: [],
        },
      ],
    };

    renderer.render(contentType, testFile);

    expect('\n' + testFile.getFullText()).toEqual(
      stripIndent(`
        import type { ChainModifiers, Entry, EntrySkeletonType, LocaleCode } from "contentful";

        export interface TypeTestFields {
            field_id: Test.Symbol;
        }

        export type TypeTestSkeleton = EntrySkeletonType<TypeTestFields, "test">;
        export type TypeTest<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeTestSkeleton, Modifiers, Locales>;
        `),
    );
  });

  it('can return a custom field renderer with docs support', () => {
    class DerivedContentTypeRenderer extends V10ContentTypeRenderer {
      protected renderField(field: ContentTypeField, context: RenderContext) {
        return {
          docs: [{ description: `Field of type "${field.type}"` }],
          name: field.id,
          hasQuestionToken: field.omitted || !field.required,
          type: super.renderFieldType(field, context),
        };
      }

      protected renderEntry(contentType: CFContentType, context: RenderContext) {
        return {
          docs: [
            {
              description: `content type "${contentType.name}" with id: ${contentType.sys.id}`,
            },
          ],
          name: context.moduleName(contentType.sys.id),
          isExported: true,
          type: super.renderEntryType(contentType, context),
        };
      }
    }

    const renderer = new DerivedContentTypeRenderer();

    const contentType: CFContentType = {
      name: 'display name',
      sys: {
        id: 'test',
        type: 'Symbol',
      },
      fields: [
        {
          id: 'field_id',
          name: 'field_name',
          disabled: false,
          localized: false,
          required: true,
          type: 'Symbol',
          omitted: false,
          validations: [],
        },
      ],
    };

    renderer.render(contentType, testFile);

    expect('\n' + testFile.getFullText()).toEqual(
      stripIndent(`
        import type { Entry, EntryFieldTypes, EntrySkeletonType } from "contentful";

        export interface TypeTestFields {
            /** Field of type "Symbol" */
            field_id: EntryFieldTypes.Symbol;
        }

        export type TypeTestSkeleton = EntrySkeletonType<TypeTestFields, "test">;
        /** content type "display name" with id: test */
        export type TypeTest = Entry<TypeTestSkeleton, Modifiers, Locales>;
        `),
    );
  });

  it('can render custom entries', () => {
    class DerivedContentTypeRenderer extends V10ContentTypeRenderer {
      protected renderEntryType(contentType: CFContentType, context: RenderContext): string {
        context.imports.add({
          moduleSpecifier: '@custom',
          namedImports: ['CustomEntry'],
          isTypeOnly: true,
        });
        return renderTypeGeneric(
          'CustomEntry',
          context.moduleSkeletonName(contentType.sys.id),
          'Modifiers',
          'Locales',
        );
      }
    }

    const renderer = new DerivedContentTypeRenderer();

    const contentType: CFContentType = {
      name: 'display name',
      sys: {
        id: 'test',
        type: 'Symbol',
      },
      fields: [
        {
          id: 'field_id',
          name: 'field_name',
          disabled: false,
          localized: false,
          required: true,
          type: 'Symbol',
          omitted: false,
          validations: [],
        },
      ],
    };

    renderer.render(contentType, testFile);

    expect('\n' + testFile.getFullText()).toEqual(
      stripIndent(`
        import type { CustomEntry } from "@custom";
        import type { EntryFieldTypes, EntrySkeletonType } from "contentful";

        export interface TypeTestFields {
            field_id: EntryFieldTypes.Symbol;
        }

        export type TypeTestSkeleton = EntrySkeletonType<TypeTestFields, "test">;
        export type TypeTest<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = CustomEntry<TypeTestSkeleton, Modifiers, Locales>;
        `),
    );
  });
});
