const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('Capacitor app ID matches the existing native Android application ID', () => {
  const capacitor = JSON.parse(read('capacitor.config.json'));
  const gradle = read('android/app/build.gradle');
  const match = gradle.match(/applicationId\s+["']([^"']+)["']/);
  assert.ok(match, 'Android applicationId must be explicitly defined');
  assert.equal(match[1], 'com.rombmaster.game', 'do not change existing installs');
  assert.equal(capacitor.appId, match[1]);
});

test('Debug Android install has isolated app ID and visible test label', () => {
  const gradle = read('android/app/build.gradle');
  const debugStrings = read('android/app/src/debug/res/values/strings.xml');
  const mainStrings = read('android/app/src/main/res/values/strings.xml');
  const manifest = read('android/app/src/main/AndroidManifest.xml');

  assert.match(gradle, /debug\s*\{[^}]*applicationIdSuffix\s+["']\.test["']/s);
  assert.match(debugStrings, /<string name="app_name">RombMaster Test<\/string>/);
  assert.match(debugStrings, /<string name="title_activity_main">RombMaster Test<\/string>/);
  assert.match(mainStrings, /<string name="app_name">RombMaster<\/string>/);
  assert.match(manifest, /android:label="@string\/app_name"/);
  assert.match(manifest, /android:authorities="\$\{applicationId\}\.fileprovider"/);
});

test('Native entry point keeps its established Java package', () => {
  const java = read('android/app/src/main/java/com/rombmaster/game/MainActivity.java');
  const gradle = read('android/app/build.gradle');
  assert.match(java, /package com\.rombmaster\.game;/);
  assert.match(gradle, /namespace\s+["']com\.rombmaster\.game["']/);
});
