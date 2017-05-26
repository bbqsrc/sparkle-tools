# sparkle-tools

Tools for managing Sparkle appcasts.

## Installation

```
npm i -g bbqsrc/sparkle-tools
```

This will install the `appcast` binary to your PATH.

## Usage

1. Generate a private key with `gen-key`
2. Create the stub `appcast.yaml` using `init "My App" "https://place.binaries.live" > appcast.yaml`
3. Create new item records by using `sign appcast_priv.pem targetbinary.zip.tgz.dmg`
4. Generate the `appcast.xml` using `generate appcast.yaml > appcast.xml`
5. Deploy everything

```
  Usage: appcast [options] [command]


  Commands:

    gen-key [dest]
    generate <appcast-yaml>
    sign <priv-key> <target>
    init <title> <base-url> [lang]

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

## License

ISC - see LICENSE file.