const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const remoteVideos = document.getElementById('js-remote-streams');
  const roomId = document.getElementById('js-room-id');
  const roomMode = document.getElementById('js-room-mode');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');
  const toggleMicrophone = document.getElementById('js-toggle-microphone');
  const toggleCamera = document.getElementById('js-toggle-camera');
  var stampNose = new Image();                            // 鼻のスタンプ画像を入れる Image オブジェクト
  var stampEars = new Image();                            // 耳のスタンプ画像を入れる Image オブジェクト
  var stampTear = new Image();                            // ★涙のスタンプ画像を入れる Image オブジェクト
  var stampSurp = new Image();                            // ★驚きのスタンプ画像を入れる Image オブジェクト
  var stampEyes = new Image();                            // ★ハートのスタンプ画像を入れる Image オブジェクト
  stampNose.src = "./face4/nose.png";                             // 鼻のスタンプ画像のファイル名
  stampEars.src = "./face4/ears.png";                             // 耳のスタンプ画像のファイル名
  stampTear.src = "./face4/tear.png";                             // ★涙のスタンプ画像のファイル名
  stampSurp.src = "./face4/surp.png";                             // ★驚きのスタンプ画像のファイル名
  stampEyes.src = "./face4/eyes.png";                             // ★ハートのスタンプ画像のファイル名
   
  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const getRoomModeByHash = () => (location.hash === '#mesh' ? 'sfu' : 'mesh');

  roomMode.textContent = getRoomModeByHash();
  window.addEventListener(
    'hashchange',
    () => (roomMode.textContent = getRoomModeByHash())
  );

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // Render local stream
  // localStreamをdiv(localVideo)に挿入 const audioStreamが不明
  const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
  const audioTrack = audioStream.getAudioTracks()[0]
  
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

    // ボタン押した時のマイク関係の動作
    toggleMicrophone.addEventListener('click', () => {
      const audioTracks = audioStream.getAudioTracks()[0];
      const localTracks = localStream.getAudioTracks()[0];
      localTracks.enabled = !localTracks.enabled;
      audioTrack.enabled = !audioTrack.enabled;
      console.log("microphone = "+audioTracks.enabled)
      toggleMicrophone.id = `${audioTracks.enabled ? 'js-toggle-microphone' : 'js-toggle-microphone_OFF'}`;
    });

    //ボタン押した時のカメラ関係の動作
    toggleCamera.addEventListener('click', () => {
      const videoTracks = videoStream.getVideoTracks()[0];
      const localTracks = localStream.getVideoTracks()[0];
      localTracks.enabled = !localTracks.enabled;
      videoTracks.enabled = !videoTracks.enabled;
      console.log(videoTracks.enabled)
  
      toggleCamera.id = `${videoTracks.enabled ? 'js-toggle-camera' : 'js-toggle-camera_OFF'}`;
  
    });

  // eslint-disable-next-line require-atomic-updates
  const peer = (window.peer = new Peer({
    key: '89e695ed-372d-437f-8248-d0c63f9c5e23',
    debug: 3,
  }));

  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const room = peer.joinRoom(roomId.value, {
      mode: getRoomModeByHash(),
      stream: localStream,
    });

    room.once('open', () => {
      messages.textContent += '=== You joined ===\n';
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined ===\n`;
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      const newVideo = document.createElement('video');
      newVideo.id = "remote";
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      // mark peerId to find it later at peerLeave event
      newVideo.setAttribute('data-peer-id', stream.peerId);
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);
    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left ===\n';
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    sendTrigger.addEventListener('click', onClickSend);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    function onClickSend() {
      // Send message to all of the peers in the room via websocket
      room.send(localText.value);

      messages.textContent += `${peer.id}: ${localText.value}\n`;
      localText.value = '';
    }
  });
  
  // clmtrackr の開始
  var tracker = new clm.tracker();  // tracker オブジェクトを作成
  tracker.init(pModel);             // tracker を所定のフェイスモデル（※1）で初期化
  tracker.start(localVideo);             // video 要素内でフェイストラッキング開始

  // 感情分類の開始
  var classifier = new emotionClassifier();               // emotionClassifier オブジェクトを作成
  classifier.init(emotionModel);                          // classifier を所定の感情モデル（※2）で初期化
   
  // 描画ループ
  function drawLoop() {
    requestAnimationFrame(drawLoop);                      // drawLoop 関数を繰り返し実行
    var positions = tracker.getCurrentPosition();         // 顔部品の現在位置の取得
    var parameters = tracker.getCurrentParameters();      // 現在の顔のパラメータを取得
    var emotion = classifier.meanPredict(parameters);     // そのパラメータから感情を推定して emotion に結果を入れる
    context.clearRect(0, 0, canvas.width, canvas.height); // canvas をクリア
    //tracker.draw(canvas);                                 // canvas にトラッキング結果を描画
    drawStamp(positions, stampNose, 62, 2.5, 0.0, 0.0);   // 鼻のスタンプを描画
    drawStamp(positions, stampEars, 33, 3.0, 0.0, -1.8);  // 耳のスタンプを描画
    if(emotion[3].value > 0.4) {                          // ★感情 sad の値が一定値より大きければ
      drawStamp(positions, stampTear, 23, 0.4, 0.0, 0.8); // ★涙のスタンプを描画（右目尻）
      drawStamp(positions, stampTear, 28, 0.4, 0.0, 0.8); // ★涙のスタンプを描画（左目尻）
    }
    if(emotion[4].value > 0.8) {                          // ★感情 surprised の値が一定値より大きければ
      drawStamp(positions, stampSurp, 14, 1.0, 0.7, 0.0); // ★驚きのスタンプを描画（顔の左）
    }
    if(emotion[5].value > 0.4) {                          // ★感情 happy の値が一定値より大きければ
      drawStamp(positions, stampEyes, 27, 0.6, 0.0, 0.0); // ★ハートのスタンプを描画（右目）
      drawStamp(positions, stampEyes, 32, 0.6, 0.0, 0.0); // ★ハートのスタンプを描画（左目）
    }
  }
  drawLoop();                                             // drawLoop 関数をトリガー
   
  // スタンプを描く drawStamp 関数
  // (顔部品の位置データ, 画像, 基準位置, 大きさ, 横シフト, 縦シフト)
  function drawStamp(pos, img, bNo, scale, hShift, vShift) {
    var eyes = pos[32][0] - pos[27][0];                   // 幅の基準として両眼の間隔を求める
    var nose = pos[62][1] - pos[33][1];                   // 高さの基準として眉間と鼻先の間隔を求める
    var wScale = eyes / img.width;                        // 両眼の間隔をもとに画像のスケールを決める
    var imgW = img.width * scale * wScale;                // 画像の幅をスケーリング
    var imgH = img.height * scale * wScale;               // 画像の高さをスケーリング
    var imgL = pos[bNo][0] - imgW / 2 + eyes * hShift;    // 画像のLeftを決める
    var imgT = pos[bNo][1] - imgH / 2 + nose * vShift;    // 画像のTopを決める
    context.drawImage(img, imgL, imgT, imgW, imgH);       // 画像を描く
  }
  
  //反響をキャンセル
  localStream.getAudioTracks().forEach(track => {
    let constraints = track.getConstraints();
    constraints.echoCancellation = true;
    track.applyConstraints(constraints);
});

  peer.on('error', console.error);
})();