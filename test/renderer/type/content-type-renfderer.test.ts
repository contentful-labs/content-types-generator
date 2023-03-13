import { Field, FieldType } from 'contentful';

import { Project, ScriptTarget, SourceFile } from 'ts-morph';
import {
  CFContentType,
  DefaultContentTypeRenderer,
  defaultRenderers,
  FieldRenderer,
  moduleFieldsName,
  moduleName,
  RenderContext,
  renderTypeGeneric,
} from '../../../src';
import stripIndent = require('strip-indent');

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
    const symbolTypeRenderer = () => {
      return 'Test.Symbol';
    };

    class DerivedContentTypeRenderer extends DefaultContentTypeRenderer {
      public createContext(): RenderContext {
        return {
          moduleName,
          moduleFieldsName,
          getFieldRenderer: <FType extends FieldType>(fieldType: FType) => {
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
        import type { Entry } from "contentful";
        
        export interface TypeTestFields {
            field_id: Test.Symbol;
        }
        
        export type TypeTest = Entry<TypeTestFields>;
        `),
    );
  });

  it('can return a custom field renderer with docs support', () => {
    class DerivedContentTypeRenderer extends DefaultContentTypeRenderer {
      protected renderField(field: Field, context: RenderContext) {
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
        import type { EntryFields } from "contentful";
        import type { Entry } from "contentful";
        
        export interface TypeTestFields {
            /** Field of type "Symbol" */
            field_id: EntryFields.Symbol;
        }
        
        /** content type "display name" with id: test */
        export type TypeTest = Entry<TypeTestFields>;
        `),
    );
  });

  it('can render custom entries', () => {
    class DerivedContentTypeRenderer extends DefaultContentTypeRenderer {
      protected renderEntryType(contentType: CFContentType, context: RenderContext): string {
        context.imports.add({
          moduleSpecifier: '@custom',
          namedImports: ['IdScopedEntry'],
          isTypeOnly: true,
        });
        return renderTypeGeneric(
          'IdScopedEntry',
          `'${contentType.sys.id}', ${context.moduleFieldsName(contentType.sys.id)}`,
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
        import type { EntryFields } from "contentful";
        import type { IdScopedEntry } from "@custom";
        
        export interface TypeTestFields {
            field_id: EntryFields.Symbol;
        }
        
        export type TypeTest = IdScopedEntry<'test', TypeTestFields>;
        `),
    );
  });
});
