const xmlbuilder = require("xmlbuilder")
const moment = require("moment")
const fs = require("fs")
const childProcess = require("child_process")

function generateSignature(privKey, target) {
  const digest = childProcess.execSync(`openssl dgst -sha1 -binary "${target.replace(/"/g, '\\"')}"`)

  const cmd = `openssl dgst -dss1 -sign "${privKey.replace(/"/g, '\\"')}" | openssl enc -base64`

  return childProcess.execSync(cmd, {
    input: digest,
    encoding: "utf8"
  }).trim()
}

function generateKeys(dest) {
  const opts = { cwd: dest, stdio: "inherit" }
  childProcess.execSync(`openssl dsaparam -out appcast_dsaparam.pem 4096`, opts)
  childProcess.execSync(`openssl gendsa appcast_dsaparam.pem -out appcast_priv.pem`, opts)
  childProcess.execSync(`chmod 0400 appcast_priv.pem`, opts)
  childProcess.execSync(`rm appcast_dsaparam.pem`, opts)
  childProcess.execSync(`openssl dsa -in appcast_priv.pem -pubout -out appcast_pub.pem`, opts)
}

function langEle(baseNode, tag, data) {
  for (const k in data) {
    baseNode.ele(tag, { "xml:lang": k }, data[k])
  }
}

function convertObjectToAppcast(data) {
  const defaultLanguage = data.language

  const root = xmlbuilder.create({
    rss: {
      "@version": "2.0",
      "@xmlns:sparkle": "http://www.andymatuschak.org/xml-namespaces/sparkle",
      "@xmlns:dc": "http://purl.org/dc/elements/1.1/"
    }
  }, { encoding: 'utf-8' })

  const channel = root.ele("channel")

  channel.ele("language", {}, defaultLanguage)

  langEle(channel, "title", data.title)
  langEle(channel, "description", data.description)

  for (const item of data.items) {
    const node = channel.ele("item")

    langEle(node, "title", item.title)
    langEle(node, "sparkle:releaseNotesLink", item.releaseNotesLink)

    node.ele("pubDate", {}, moment(item.pubDate).utc().format("ddd, DD MMM YYYY HH:mm:ss ZZ"))
    node.ele("enclosure", {
      url: `${data.baseUrl}/${item.filePath}`,
      length: item.fileSize,
      type: "application/octet-stream",
      "sparkle:version": item.version,
      "sparkle:dsaSignature": item.signature
    })
  }

  return root.end({ pretty: true })
}

const itemTmpl = (target, sig) => `\
  - title:
      en:
    releaseNotesLink:
      en:
    version: x.y.z
    pubDate: ${new Date().toISOString()}
    filePath: ${target}
    fileSize: ${fs.statSync(target).size}
    signature: ${sig}`

const appcastTmpl = (title, url, lang = "en") => `\
language: ${lang}
baseUrl: ${url}
title:
  ${lang}: ${title}
description:
  ${lang}: # Add description here
items:
  - title:
      ${lang}: # First release title
    releaseNotesLink:
      ${lang}: # Link to the release notes to be embedded
    version: # x.y.z
    pubDate: # Date, like: ${new Date().toISOString()}
    filePath: # filename.foo (will prepend baseUrl)
    fileSize: # size of file in bytes
    signature: # DSA signature of file used by Sparkle
`

function generateAppcastItem(privKey, target) {
  const signature = generateSignature(privKey, target)

  return itemTmpl(target, signature)
}

function generateAppcastStub(title, url, lang) {
  return appcastTmpl(title, url, lang || "en")
}

module.exports = {
  generateKeys,
  generateAppcastItem,
  generateAppcastStub,
  convertObjectToAppcast
}