import {storage} from "@vendetta/plugin";
import {findByStoreName, findByProps} from "@vendetta/metro";
import {ReactNative, FluxDispatcher} from "@vendetta/metro/common";

const {DCDSoundManager} = ReactNative.NativeModules;
const SelectedChannelStore = findByStoreName("SelectedChannelStore");

const FART_URL =
  "https://raw.githubusercontent.com/eszgit/vendettaplugins/master/plugins/Fart/src/fart.ogg";
const SOUND_ID = 1337;
let SOUND_DURATION = -1;

const prepareSound = () =>
  new Promise((resolve) =>
    DCDSoundManager.prepare(FART_URL, "notification", SOUND_ID, (_, meta) =>
      resolve(meta)
    )
  );
let playingTimeout: number | null = null;
let playing = false;
async function playSound() {
  if (playing) {
    if (playingTimeout != null) clearTimeout(playingTimeout);
    DCDSoundManager.stop(SOUND_ID);
    playing = false;
  }
  playing = true;
  await DCDSoundManager.play(SOUND_ID);
  playingTimeout = setTimeout(() => {
    playing = false;
    DCDSoundManager.stop(SOUND_ID);
    playingTimeout = null;
  }, SOUND_DURATION);
}

function onMessage(event) {
  if (
    event.message.content &&
    event.channelId == SelectedChannelStore.getChannelId() &&
    !event.message.state &&
    event.sendMessageOptions == undefined
  ) {
    let count = (event.message.content.match(/fart/gi) ?? []).length;
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        setTimeout(playSound, i * 350);
      }
    }
  }
}

let soundPrepared = false;

export default {
  onLoad: () => {
    if (!soundPrepared) {
      prepareSound().then((meta: Record<string, number>) => {
        soundPrepared = true;
        SOUND_DURATION = meta.duration;
      });
    }
    FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
  },
  onUnload: () => {
    FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
  },
}
