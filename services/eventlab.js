//const fs = require('node:fs')
import fs from 'node:fs';
import fetch from 'node-fetch';
import ffmpeg from 'ffmpeg';
/**
 *
 * @param {*} voiceId clone voice vwfl76D5KBjKuSGfTbLB
 * @returns
 */
const textToVoice = async (text,voiceId = 'jsCqWAovK2LkecY7zXl4') => {
  const EVENT_TOKEN = process.env.EVENT_TOKEN; //'b3abc147e7e17e069669a8c4ee2940b1' ?? "";
  const URL = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const CHUNK_SIZE = 1024;
  //const header = new Headers();
  // header.append("accept", "audio/mpeg");
  // header.append("xi-api-key", EVENT_TOKEN);
  // header.append("Content-Type", "application/json");
  const header = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": EVENT_TOKEN
  };
  const raw = JSON.stringify({
    text,
    model_id: "eleven_multilingual_v1",
    voice_settings: {
      stability: 0.55,
      similarity_boost: 0.45,
    },
  });
  const requestOptions = {
    method: "POST",
    headers: header,
    body: raw,
    redirect: "follow",
  };
  const response = await fetch(URL, requestOptions);
  const buffer = await response.arrayBuffer();
  const pathFile = `${process.cwd()}/tmp/${Date.now()}-audio.mp3`;
  fs.writeFileSync(pathFile, Buffer.from(buffer));
  return pathFile;

};

export default textToVoice;