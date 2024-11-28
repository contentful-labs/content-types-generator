import { Project, SourceFile } from 'ts-morph';
import { moduleName } from '../../module-name';
import { CFContentType } from '../../types';
import { BaseContentTypeRenderer } from './base-content-type-renderer';
import { renderTypeGeneric } from '../generic';

export class V10TypeGuardRenderer extends BaseContentTypeRenderer {
  private readonly files: SourceFile[];

  private static readonly WithContentTypeLink = 'WithContentTypeLink';
  constructor() {
    super();
    this.files = [];
  }

  public override setup(project: Project): void {
    super.setup(project);
  }

  public render = (contentType: CFContentType, file: SourceFile): void => {
    const entryInterfaceName = moduleName(contentType.sys.id);

    file.addImportDeclaration({
      moduleSpecifier: `contentful`,
      namedImports: ['ChainModifiers', 'Entry', 'LocaleCode'],
      isTypeOnly: true,
    });

    file.addFunction({
      isExported: true,
      name: renderTypeGeneric(
        `is${entryInterfaceName}`,
        'Modifiers extends ChainModifiers',
        'Locales extends LocaleCode',
      ),
      returnType: `entry is ${renderTypeGeneric(entryInterfaceName, 'Modifiers', 'Locales')}`,
      parameters: [
        {
          name: 'entry',
          type: renderTypeGeneric('Entry', 'EntrySkeletonType', 'Modifiers', 'Locales') | undefined,
        },
      ],
      statements: `return entry?.sys?.contentType?.sys?.id === '${contentType.sys.id}'`,
    });

    file.organizeImports({
      ensureNewLineAtEndOfFile: true,
    });

    file.formatText();
  };

  public override additionalFiles(): SourceFile[] {
    return this.files;
  }
}
