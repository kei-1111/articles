---
title: Unity as a Libraryを用いて3Dアプリを作成しよう！【Android】【Unity 2022】
tags:
  - Unity
  - UaaL
  - Android
  - JetpackCompose
  - Kotlin
author: kei-1111
slide: false
qiita_id: 87bb74ffef15158b5378
---
# はじめに

はじめまして、[kei-1111](https://x.com/kei_1111_)です。

Androidアプリ開発においてネイティブアプリに3Dを組み込みたいと思うことはありませんか？
実際にAndroidに3Dを実装する際に考えられる選択肢として、以下のものなどが挙げられます。

- [SceneView](https://github.com/SceneView/sceneview-android)
- [filament](https://github.com/google/filament)
- [OpenGL](https://developer.android.com/develop/ui/views/graphics/opengl/about-opengl?hl=ja)
- [Unity as a Library](https://unity.com/ja/features/unity-as-a-library)

今回はこの中の一つ、**Unity as a Library**（以下、UaaL）を用いて、AndroidアプリにUnity 2022を組み込み相互通信するところまで紹介します！

:::note
今回は、UaaLを導入し3Dアプリを作成する方法を紹介しますが、3Dモデルを少し表示させたいといった場合はSceneViewのほうが適しているなど向き不向きがあります。プロジェクトによって何が最適か考えてから導入を行ってください。
:::


### この記事で学べること
✅ UnityプロジェクトをAndroidアプリに組み込む方法（モジュール/AAR両対応）
✅ ComposeでUnityコンテンツを表示する方法
✅ Android ↔ Unity間の双方向通信の実装




# UaaLとは
UaaLは、UnityのARや3D/2Dのリアルタイムレンダリング機能をネイティブアプリに組み込むことができる技術です。Unity 2019.3から正式サポートとなりました。

公式サイトでは以下のように説明されています。
> 拡張現実(AR)、3D/2D リアルタイムレンダリング、2D ミニゲームなど、Unity で開発した機能を、ネイティブモバイルアプリケーションに直接挿入。




# 開発環境
- OS: macOS Sequioia 15.5
- Android Studio: Narwhal Feature Drop 2025.1.2 
- Unity: 2022.3.62f2

:::note warn 
Unity 6以降だと今回紹介する方法は使用できません、UnityPlayerというAndroidでUnityを扱えるようにするクラスが変わってしまう影響です。Unity 6以降で実装する方法は、別の記事を書くのでそちらをご覧ください。
:::




# 導入

## 1. Unityプロジェクトの作成

Androidに組み込むUnityプロジェクトを作成します。今回はUnityプロジェクト作成方法の解説は省略します。
説明のために、簡単なUnityプロジェクトを作成したので、UaaLの導入だけ試してみたい方は、使用してみてください。

https://github.com/kei-1111/uaal-sample-unity2022-unity

簡単にプロジェクトの説明をすると、実行するとランダムな箇所から球を落とすというスクリプトを用意したプロジェクトです。

![[./images/01_unity_sphere_demo.avif|100%]]




## 2. Unityプロジェクトのエクスポート

:::note warn
今回作成しているUnityバージョンが`2022.3.62f2`のため画像のUIになっていますが、Unity6以降だとUIが変わっています。Unity 6の記事は別で上げる予定なのでそちらをご覧ください。
:::

ここでは、作成したプロジェクトをエクスポートし、実際にAndroidに組み込む`unityLibrary`を作成します。

まず、Unityプロジェクトのツールバーから`File` ▶ `Build Settings`を選択し**Build Settings**を開きます。このとき画像のように`Platform`を`Android`へスイッチし、`Export Project`のチェック追加も忘れずにしておきましょう！これを行わないと、Androidに組み込む`unityLibrary`が作成されなくなります。

| ![[./images/02_unity_build_settings.avif|100%]] |
:--:
▲Build Settings

次に、Build Setting左下の「Player Settings...」から**Player Settings**を表示させます。Player Settingsでは、エクスポートするUnityプロジェクトの詳細設定をすることができます。最初に行うべき設定を行っていきます。まず、`Other Settings` ▶ `Configuration` ▶ `Scription Backend`を`IL2CPP`へと変更してください。次に、`Other Settings` ▶ `Configuration` ▶ `Target Architectures`で`ARMv7`と`ARM64`にチェックをつけてください。これで必須の設定は完了です。

| ![[./images/03_unity_player_settings.avif|100%]] |
:--:
▲Player Settings

Player Settingsではエクスポートする`unityLibrary`の設定をすることができます。以下に主観で選んだ使いそうな設定を載せておくので、自分のプロジェクトにあった設定をしてみてください。他にもまだまだあるので、色々触ってみてください。

**Resolution and Presentaiton**
- Fullscreen Mode
- Navigation Bar　表示/非表示
- 画面回転

**Splash Image**
- Splash　表示/非表示（Proプランならば非表示にすることができます！学生なら無料でProプランになれるのでぜひしてみよう :muscle: ）
- Splash時に表示する画像

Player Settingsでエクスポート設定が終わったら、Player Settingsを閉じてBuild Settings右下の「Export」からエクスポートします。エクスポートするフォルダを選択する必要があるので、任意のフォルダを作成し、エクスポートしましょう！
選択したフォルダの中に`unityLibrary`があれば成功です！！

![[./images/04_unity_export_folder.avif|100%]]




## 3. Unityプロジェクトの組み込み

作成した`unityLibrary`をAndroidに組み込む方法は主に2つあります。

1. モジュールとして組み込む
2. AARとして取り込む（おすすめ）

どちらも紹介するので、気に入った方法を試してみてください！

:::note
AARはunityLibraryモジュールより大きくないためGitで管理することができます（プロジェクトによるとは思います）。またAndroidで一度AARを読み込むように設定すれば、AARを切り替えるだけでUnityの変更を反映することができるようになります。これらの理由からAARとして取り込む方法がおすすめです :eyes:
:::

### モジュールとして組み込む

まず、Unityを組み込みたいAndroidプロジェクトの配下にエクスポートした`unityLibrary`を配置します。

![[./images/05_unity_library_module.avif|300]]

`unityLibrary`はサイズが大きくGit管理できないので、`.gitignore`でGit管理しないようにするのがおすすめです :eyes: 
管理しないようにする場合は、プロジェクト直下の`.gitignore`に`/unityLibrary`を追加します。


次に、unityLibraryのbuild.gradleを変更します。
主な変更点は以下のようになっています。

```diff_gradle:unityLibrary/build.gradle
// 前略

android {
    // 中略
    
-    aaptOptions {
-        noCompress = ['.unity3d', '.ress', '.resource', '.obb', '.bundle', '.unityexp'] + unityStreamingAssets.tokenize(', ')
-        ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~"
-    }

// 中略

def BuildIl2Cpp(String workingDir, String configuration, String architecture, String abi, String[] staticLibraries) {

    // 中略
-    commandLineArgs.add("--tool-chain-path=" + android.ndkDirectory)
+    commandLineArgs.add("--tool-chain-path=" + android.ndkPath)

}

// 後略

```

`aaptOptions`があると、存在しない`unityStreamingAssets`にアクセスしようとしてSyncできませんでした。また、デフォルトだと`ndkDirectory`という宣言を`android`ブロックでしていないにもかかわらず、使用しようとしておりSyncできないので`ndkPath`へと変更する必要があります。

次に、Android側でモジュールとして認識するように`settings.gradle.kts`と`app/build.gradle.kts`の編集を行います。

```diff_kotlin:settings.gradle.kts
// 前略

rootProject.name = "uaal-sample-unity2022-android"
include(":app")
+include(":unityLibrary")
```

```diff_kotlin:app/build.gradle.kts
// 前略

val unityLibraryLibsDir = project(":unityLibrary").projectDir.resolve("libs")

dependencies {

    implementation(project(":unityLibrary"))
    implementation(fileTree(mapOf("dir" to unityLibraryLibsDir, "include" to listOf("*.jar"))))

    // 中略
}
```

ここまで設定して`Sync Now`すれば、モジュールとしてUnityプロジェクトを組み込む方法は終わりです！！
次の「4.Unityの表示」に進んでください。

### AARとして組み込む

AARとして組み込む方法を試すには、gradleコマンドを使えるようにしてください。gradleを使えるようにする方法の解説は省略させていただきます。gradleが使えるかの確認は、`gradle -v`した際に、バージョンが出てくるようになればgradleを使えます。

次に、`unityLibrary`配下に移動して、`gradle assembleRelease`コマンドを実行してください。これは、AARを作成するためのコマンドです。`BUILD SUCCESSFUL`と出れば成功です！`unityLibrary/build/outputs/aar/unityLibrary-release.aar`があるはずです :eyes: 

ここまでできたら、あとはAndroidにAARを入れるだけです。Unityを組み込みたいAndroidプロジェクトにAARを入れるためのフォルダを作成します。今回は`libs/unity`フォルダを作成し移動させました！（root配下においても大丈夫です :ok_hand: その場合は、appモジュールの`build.gradle.kts`で指定するパスを変更しておいてください）

![[./images/06_unity_library_aar.avif|300]]


Unityを使用したいモジュールの`build.gradle.kts`の`dependencies`にAARを使用できるようにするための依存関係を追加します。
今回は、appモジュールの`build.gradle.kts`に以下のように記述しAARを使用できるようにしました！
AARの配置場所を変更した際は、`build.gradle.kts`のAARのパスも変更を行ってください。

```kotlin:build.gralde.kts
// 前略

val unityLibraryAar = File(rootDir, "libs/unity/unityLibrary-release.aar")

dependencies {
    implementation(files(unityLibraryAar))

    // 中略
}
```

ここまで設定して`Sync Now`すれば、AARとしてUnityプロジェクトを組み込む方法は終わりです！！
次の「4. Unityの表示」に進んでください。



## 4. Unityの表示

実際にUnityを表示させる前に、`app/src/main/res/values/strings.xml`にUnityが使用するための文字列を追加します。Unityが内部で`game_view_content_description`を使用しているらしく、この文字列設定がないと、アプリがクラッシュします。肝心の文字列は`Game view`としていますが、何でも大丈夫です。

```diff_xml:strings.xml
<resources>
    <string name="app_name">uaal-sample-unity2022-android</string>
+    <string name="game_view_content_description">Game view</string>
</resources>
```

ここからは、実際にUnityを表示させます！
以下は、実装例です。
```kotlin:MainActivity
class MainActivity : ComponentActivity() {

    private var unityPlayer: UnityPlayer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        unityPlayer = UnityPlayer(this)

        setContent {
            UaalsampleTheme {
                AndroidView(
                    factory = { unityPlayer!! },
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        unityPlayer?.windowFocusChanged(hasFocus)
    }

    override fun onResume() {
        super.onResume()
        unityPlayer?.resume()
    }

    override fun onPause() {
        super.onPause()
        unityPlayer?.pause()
    }
}
```

UaaLはComposeに対応しておらず、そのまま表示させることはできないため、AndroidViewを使用して表示させています。

ここで重要なポイントは2つあります。

1. `onResume()`と`onPause()`で適切にライフサイクルの管理を行わないといけない
2. `onWindowFocusChanged(hasFocus: Boolean)`で`windowFocusChanged`を呼ばないといけない

これらを適切に行わないと、Unityの画面がフリーズするといった問題が起きるため、ライフサイクル管理と、アクティビティでのフォーカス管理は忘れないようにしてください。

:::note
ComposeのNavigationを行う際は、DisposableEffectを利用したライフサイクル管理で、適切に`unityPlayer.resume()`と`unityPlayer.pause()`を行ってください。それができれば、フリーズすることなく動くはずです...！
:::

ここまでの実装を行うと、以下のように組み込んだUnityが表示されるようになります。
（サンプルとして作成したUnityはなんの設定も行っていないので初期背景のままです...）

![[./images/07_unity_first_view.avif|400]]



## 5. UnityとAndroidの相互通信

ここからは、AndroidからUnity、UnityからAndroidといった相互での通信ができるようにしていきます。

### AndroidからUnity

まず、Androidから呼び出すスクリプトを作成します。

```c#:ObjectSpawner.cs
using UnityEngine;

public class ObjectSpawner : MonoBehaviour
{
    [SerializeField] private float spawnHeight = 10f;
    [SerializeField] private float spawnRangeX = 5f;
    [SerializeField] private float spawnRangeZ = 5f;

    private int objectCount = 0;

    public void SpawnObject()
    {
        // ランダムな位置を計算
        float randomX = Random.Range(-spawnRangeX, spawnRangeX);
        float randomZ = Random.Range(-spawnRangeZ, spawnRangeZ);
        Vector3 spawnPosition = new Vector3(randomX, spawnHeight, randomZ);

        // Sphereを生成
        GameObject sphere = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        sphere.transform.position = spawnPosition;

        // Rigidbodyを追加
        Rigidbody rb = sphere.AddComponent<Rigidbody>();
        rb.collisionDetectionMode = CollisionDetectionMode.Continuous;

        // カウントを増やす
        objectCount++;

        // 5の倍数チェック
        if (objectCount % 5 == 0)
        {
            OnMultipleOfFive();
        }

        // 10秒後に削除
        Destroy(sphere, 10f);
    }

    /// <summary>
    /// カウントが5の倍数になった時の処理
    /// </summary>
    private void OnMultipleOfFive()
    {
        /// TODO: Androidへメッセージを送る処理を作成
    }

    /// <summary>
    /// 現在のカウントを取得
    /// </summary>
    public int GetCount()
    {
        return objectCount;
    }

    /// <summary>
    /// カウントをリセット
    /// </summary>
    public void ResetCount()
    {
        objectCount = 0;
    }

    // テスト用: Spaceキーで落下テスト
    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            SpawnObject();
        }
    }
}
```

このスクリプトでは、呼び出されると球を落とす`SpawnObject()`定義しています。今回は`SampleManager`Unityオブジェクトに、このスクリプトをアタッチして球を落とすようにしました。

次に、AndroidからUnityへとメッセージを送れるようにします。AndroidからUnityへとメッセージを送るためには、`UnitySendMessage`関数を呼び出します。
`UnitySendMessage`関数は、文字列を3つ受け取ります。それぞれ意味があり、以下のようになっています。

**1つ目の文字列は、呼び出す対象となるオブジェクト名**
**2つ目の文字列は、呼び出す関数**
**3つ目の文字列は、Unityに渡したい文字列**

今回は、オブジェクト名と呼び出す関数をそれぞれ列挙するenumクラスを作成し、タイポが起こらないようします。

```kotlin:UnityObject.kt
enum class UnityObject(val objectName: String) {
    SAMPLE_MANAGER("SampleManager")
}
```

```kotlin:UnityMethod.kt
enum class UnityMethod(val methodName: String) {
    SPAWN_OBJECT("SpawnObject")
}
```

これらを組み合わせて`UnitySendMessage`をこのようにしました。この関数を呼び出すだけで、最初に紹介したように球が落ちてくるようになります。（今回は文字列を渡さないので、第3引数は`""`となっています。）

```kotlin
UnitySendMessage(UnityObject.SAMPLE_MANAGER.objectName, UnityMethod.SPAWN_OBJECT.methodName, "")
```

`UnitySendMessage`を呼び出すボタンも配置したMainActivityの全体像はこのようになりました。

```kotlin:MainActivity.kt
class MainActivity : ComponentActivity() {

    private var unityPlayer: UnityPlayer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        unityPlayer = UnityPlayer(this)

        setContent {
            UaalsampleTheme {
                Box(
                    modifier = Modifier.fillMaxSize()
                ) {
                    AndroidView(
                        factory = { unityPlayer!! },
                        modifier = Modifier.fillMaxSize()
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .safeGesturesPadding()
                    ) {
                        Button(
                            onClick = {
                                // onClickのタイミングでUnityへメッセージを送る                            
                                UnitySendMessage(UnityObject.SAMPLE_MANAGER.objectName, UnityMethod.SPAWN_OBJECT.methodName, "")
                            },
                            modifier = Modifier.align(Alignment.BottomCenter)
                        ) {
                            Text(
                                text = "Send Message to Unity"
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        unityPlayer?.windowFocusChanged(hasFocus)
    }

    override fun onResume() {
        super.onResume()
        unityPlayer?.resume()
    }

    override fun onPause() {
        super.onPause()
        unityPlayer?.pause()
    }
}
```

これを実行すると以下のようになります。
（Unity側でのマテリアル設定がうまくできておらずピンク色の球が落ちてきています...
Unity詳しくないので許してください :pray: ）

![[./images/08_android_to_unity.avif|400]]

これで、Android側のコンポーネントからUnityメソッドを呼び出せるようになりました :raised_hands:


### UnityからAndroid

UnityからAndroidへメッセージを送るようにします。Androidでは、Unityが呼ぶオブジェクトを作成します。Unityでは、作成したオブジェクトのメソッドを呼び出すという形でUnityからAndroidへのメッセージ送信ができるようになります。

Unityが呼び出すオブジェクトはこのようにしました。Unityからは`sendMessage`関数を呼び出すことでメッセージを送ります。Androidでは、`Listener`インターフェースをオーバーライドしたクラスでUnityから送られてきたメッセージを処理します。
```kotlin:UnityMessageReceiver.kt
object UnityMessageReceiver {
    interface Listener {
        fun onMessageReceived(message: String)
    }

    var listener: WeakReference<Listener>? = null

    fun sendMessage(message: String) {
        listener?.get()?.onMessageReceived(message)
    }
}
```

今回は`MainActivity`で`Listener`をオーバーライドし処理を行うようにしました。

```diff_kotlin:MainActivity
// UnityMessageReceiver.Listenerをオーバーライドし、Unityからのメッセージを受け取れるように
+ class MainActivity : ComponentActivity(), UnityMessageReceiver.Listener {

    private var unityPlayer: UnityPlayer? = null

    // listenerの初期化は忘れずに！！
+    init {
+        UnityMessageReceiver.listener = WeakReference(this)
+    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        unityPlayer = UnityPlayer(this)

        setContent {
            // UIは変わらないので省略
        }
    }

    // Unityからのメッセージを受け取る関数（今回はToastを表示）
+    override fun onMessageReceived(message: String) {
+        Toast.makeText(this, message + "個落としました", Toast.LENGTH_SHORT).show()
+    }

    // onWindowFocusChanged()やonPause()なので後略
}
```

:::note
今回は`MainActivity`でUnityからのメッセージを受け取るようにしましたが、本来であれば`ViewModel`などで`UnityMessageReceiver.Listener`をオーバーライドし、値を更新などを行うようにしてください。
:::

これで、AndroidでUnityメッセージを受け取る準備ができました。次にUnityでAndroidへメッセージを送る処理を書いていきましょう。

```diff_c_sharp:ObjectSpawner.cs
using UnityEngine;

public class ObjectSpawner : MonoBehaviour
{
    /// 前略

    /// <summary>
    /// カウントが5の倍数になった時の処理
    /// </summary>
    private void OnMultipleOfFive()
    {
+        AndroidJavaObject androidMessenger = new AndroidJavaObject("io.github.kei_1111.uaal_sample_unity2022_android.UnityMessageReceiver");
+        androidMessenger.Call("sendMessage", objectCount.ToString());
    }

    /// 後略
}
```

今回は落ちた球の数が5の倍数になったとき、Androidへトータルいくつ球が落ちたかの数を送るようにしました。
`AndroidJavaObject`に渡した文字列`io.github.kei_1111.uaal_sample_unity2022_android.UnityMessageReceiver`は、UnityMessageReceiverへのパスとなっています。UnityMessageReceiverの命名を変えたり、フォルダ位置を変えたりした場合は、ここも変更するようにしてください。`パッケージ名.オブジェクト名`にすれば問題ないと思います。
`Call`関数は、文字列を2つ受け取ります。それぞれ意味があり、以下のようになっています。

**1つ目の文字列は、呼び出す対象となる関数**
**2つ目の文字列は、Androidに渡したい文字列**

今回は`sendMessage`に球が落とした数を渡すようにしました。

これを実行すると以下のようになります。落とした球の数を反映したToastが表示されています！！UnityからAndroidへメッセージを送ることができました :raised_hands:

![[./images/09_unity_to_android.avif|400]]


# 終わりに

今回はUaaLを用いて、AndroidプロジェクトにUnityを組み込む方法を解説しました！合わせて、UnityとAndroidで相互通信もできるようにしました。これで、一通りUaaLを使えるようになったと思います :raised_hands:
今回UaaLを試したリポジトリ載せておくので、気になった方はぜひ試してみてください。Android側はブランチを切っており、モジュールでUaaLを使えるようにした方法は`unitylibrary-module`、AARで組み込んだ方法は`main`となっています。確認したい場合は、ブランチを切り替えて確認してみてください。（unityLibraryをgitで管理することができなかったため、unitylibrary-moduleは単体では動きません。）

https://github.com/kei-1111/uaal-sample-unity2022-android

https://github.com/kei-1111/uaal-sample-unity2022-unity


普段withmoというUaaLを使用したAndroidアプリを開発しています。このアプリでは、壁紙にUnityを表示したりと更にUaaLを発展させたプロジェクトとなっています。Playストアで公開中ですので、ぜひ使用してみてください。近々、大きなアップデートが入る予定です :eyes: 

https://play.google.com/store/apps/details?id=io.github.kei_1111.withmo


# 参考記事

https://zenn.dev/arsaga/articles/ede728a794a553
