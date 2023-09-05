
export interface CLIFlag {
    type: 'string' | 'boolean';
    names: string[];
    description: string;
}
export const rawCLIFlagOptions: CLIFlag[] = [
    {
        names: ['v', 'version'],
        type: 'boolean',
        description: 'Prints the version number of this program to stdout'
    },
    {
        names: ['h', 'help'],
        type: 'boolean',
        description: 'Prints help information to stdout'
    },
    {
        names: ['verbose'],
        type: 'boolean',
        description: 'Shows verbose logs'
    },
    {
        names: ['preview'],
        type: 'boolean',
        description: 'Starts a http server to preview the generated html and associated files locally.  Press Ctrl+c to close the http server.'
    },
    {
        names: ['parseDir'],
        type: 'string',
        description: 'Specifies which directory should have its files converted into a website.  This can also be defined in the config file.'
    },
    {
        names: ['publish'],
        type: 'boolean',
        description: 'Publishes the generated files to the web via Vercel.  Note: vercelToken is required to use --publish.'
    },
    {
        names: ['overwrite-template'],
        type: 'boolean',
        description: 'Overwrites existing template files with the default.'
    },
    {
        names: ['vercelToken'],
        type: 'string',
        description: 'Used in concert with --publish in order to publish the generated files to the web via Vercel.'
    },
]
export function getCliFlagOptions() {
    const cliFlagOptions: { boolean: string[], string: string[] } = {
        boolean: [],
        string: []
    };
    // Assemble cliFlagOptions
    for (const flag of rawCLIFlagOptions) {
        for (const name of flag.names) {
            cliFlagOptions[flag.type].push(name);
        }
    }
    return cliFlagOptions;

}