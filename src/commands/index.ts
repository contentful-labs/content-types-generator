import { Args, Command, Flags } from '@oclif/core';

// eslint-disable-next-line unicorn/prefer-module
const contentfulExport = require('contentful-export');
import * as fs from 'fs-extra';
import { writeFile } from 'fs-extra';
import * as path from 'node:path';
import CFDefinitionsBuilder from '../cf-definitions-builder';
import {
  ContentTypeRenderer,
  DefaultContentTypeRenderer,
  JsDocRenderer,
  LocalizedContentTypeRenderer,
  ResponseTypeRenderer,
  TypeGuardRenderer,
  V10ContentTypeRenderer,
  V10TypeGuardRenderer,
} from '../renderer';
import { CFEditorInterface } from '../types';

class ContentfulMdg extends Command {
  static description = 'Contentful Content Types (TS Definitions) Generator';

  static flags = {
    version: Flags.version({ char: 'v' }),
    help: Flags.help({ char: 'h' }),
    out: Flags.string({ char: 'o', description: 'output directory' }),
    preserve: Flags.boolean({ char: 'p', description: 'preserve output folder' }),
    v10: Flags.boolean({ char: 'X', description: 'create contentful.js v10 types' }),
    localized: Flags.boolean({ char: 'l', description: 'add localized types' }),
    jsdoc: Flags.boolean({ char: 'd', description: 'add JSDoc comments' }),
    typeguard: Flags.boolean({ char: 'g', description: 'add type guards' }),
    response: Flags.boolean({ char: 'r', description: 'add response types' }),
    modifier: Flags.string({ char: 'm', description: 'add default modifier (v10 only)' }),

    // remote access
    spaceId: Flags.string({ char: 's', description: 'space id' }),
    token: Flags.string({
      char: 't',
      description: 'management token',
      default: process.env.CTF_CMA_TOKEN,
    }),
    environment: Flags.string({ char: 'e', description: 'environment' }),
    host: Flags.string({ char: 'a', description: 'host', default: 'api.contentful.com' }),
  };

  static args = {
    file: Args.file({ description: 'local export (.json)' }),
  };

  async run(): Promise<string | void> {
    const { args, flags } = await this.parse(ContentfulMdg);

    if (args.file && !fs.pathExistsSync(args.file)) {
      this.error(`file ${args.file} doesn't exists.`);
    }

    let content;

    if (args.file) {
      content = await fs.readJSON(args.file);
      if (!content.contentTypes) this.error(`file ${args.file} is missing "contentTypes" field`);
    } else {
      if (!flags.spaceId) this.error('Please specify "spaceId".');
      if (!flags.token) this.error('Please specify "token".');

      content = await contentfulExport({
        spaceId: flags.spaceId,
        managementToken: flags.token,
        environmentId: flags.environment,
        skipContent: true,
        skipRoles: true,
        skipWebhooks: true,
        saveFile: false,
        host: flags.host,
      });
    }

    const v10Options: ConstructorParameters<typeof V10ContentTypeRenderer>[0] = {};

    if (flags.modifier) {
      if (!flags.v10) {
        this.error('"--modifier" option is only available for contentful.js v10 types.');
      }

      if (
        flags.modifier !== 'WITHOUT_UNRESOLVABLE_LINKS' &&
        flags.modifier !== 'WITHOUT_LINK_RESOLUTION'
      ) {
        this.error(
          `--modifier" option only allows values: WITHOUT_UNRESOLVABLE_LINKS | WITHOUT_LINK_RESOLUTION.`,
        );
      }

      v10Options.defaultModifier = flags.modifier;
    }

    const renderers: ContentTypeRenderer[] = flags.v10
      ? [new V10ContentTypeRenderer(v10Options)]
      : [new DefaultContentTypeRenderer()];
    if (flags.localized) {
      if (flags.v10) {
        this.error(
          '"--localized" option is not needed, contentful.js v10 types have localization built in.',
        );
      }

      renderers.push(new LocalizedContentTypeRenderer());
    }

    if (flags.jsdoc) {
      renderers.push(new JsDocRenderer());
    }

    if (flags.typeguard) {
      renderers.push(flags.v10 ? new V10TypeGuardRenderer() : new TypeGuardRenderer());
    }

    if (flags.response) {
      if (!flags.v10) {
        this.error('"--response" option is only available for contentful.js v10 types.');
      }

      renderers.push(new ResponseTypeRenderer());
    }

    const editorInterfaces = content.editorInterfaces as CFEditorInterface[] | undefined;

    const builder = new CFDefinitionsBuilder(renderers);
    for (const model of content.contentTypes) {
      const editorInterface = editorInterfaces?.find(
        (e) => e.sys.contentType.sys.id === model.sys.id,
      );
      builder.appendType(model, editorInterface);
    }

    if (flags.out) {
      const outDir = path.resolve(flags.out);
      if (!flags.preserve && fs.pathExistsSync(outDir)) {
        await fs.remove(outDir);
      }

      await fs.ensureDir(outDir);
      await builder.write(flags.out, writeFile);
    } else {
      this.log(builder.toString());
    }
  }
}

export = ContentfulMdg;
