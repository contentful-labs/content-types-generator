import { Project, ScriptTarget, SourceFile } from 'ts-morph';
import { CFContentType, DefaultContentTypeRenderer, V10TypeGuardRenderer } from '../../../src';
import stripIndent = require('strip-indent');

describe('A content type type guard renderer class', () => {
  let project: Project;
  let testFile: SourceFile;
  let mockContentType: CFContentType;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ScriptTarget.ES5,
        declaration: true,
      },
    });

    mockContentType = {
      name: 'Animal',
      sys: {
        id: 'animal',
        type: 'Symbol',
      },
      fields: [
        {
          id: 'bread',
          name: 'Bread',
          disabled: false,
          localized: false,
          required: true,
          type: 'Symbol',
          omitted: false,
          validations: [],
        },
      ],
    };

    testFile = project.createSourceFile('test.ts');
  });

  describe('with default content type declarations', () => {
    it('renders entry type guard', () => {
      const defaultRenderer = new DefaultContentTypeRenderer();
      defaultRenderer.setup(project);
      defaultRenderer.render(mockContentType, testFile);

      const typeGuardRenderer = new V10TypeGuardRenderer();
      typeGuardRenderer.render(mockContentType, testFile);

      expect('\n' + testFile.getFullText()).toEqual(
        stripIndent(`
        import type { ChainModifiers, Entry, EntryFields, LocaleCode } from "contentful";
        
        export interface TypeAnimalFields {
            bread: EntryFields.Symbol;
        }
        
        export type TypeAnimal = Entry<TypeAnimalFields>;
        
        export function isTypeAnimal<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry?: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeAnimal<Modifiers, Locales> {
            return entry?.sys?.contentType?.sys?.id === 'animal'
        }
        `),
      );
    });

    it('creates type guard helper types', () => {
      const typeGuardRenderer = new V10TypeGuardRenderer();
      typeGuardRenderer.setup(project);
      typeGuardRenderer.render(mockContentType, testFile);
      const typeGuardFile = project.getSourceFiles()[0];

      expect('\n' + typeGuardFile.getFullText()).toEqual(
        stripIndent(`
        import type { ChainModifiers, Entry, LocaleCode } from "contentful";

        export function isTypeAnimal<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry?: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeAnimal<Modifiers, Locales> {
            return entry?.sys?.contentType?.sys?.id === 'animal'
        }
        `),
      );
    });
  });
});
