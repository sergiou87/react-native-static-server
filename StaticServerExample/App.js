/**
 * Sample React Native Static Server
 * https://github.com/futurepress/react-native-static-server
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  NativeModules
} from 'react-native';

// requires react-native-webview, see: https://github.com/uuidjs/uuid#getrandomvalues-not-supported
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import StaticServer from 'react-native-static-server';
import RNFetchBlob from "rn-fetch-blob";
import { WebView } from 'react-native-webview';

type Props = {};
export default class App extends Component<Props> {
  
  constructor(opts) {
    super();

    this.state = {
      origin: ''
    }
  }

  async componentWillMount() {
    this.port = this.props.port || 3030;
    this.root = this.props.root || "www/";
    this.file = this.props.file || 'index.html';

    // Get HTML file from require
    let html = require('./index.html');
    let {uri} = Image.resolveAssetSource(html);

    let path = RNFetchBlob.fs.dirs.DocumentDir + "/" + this.root;
    let dest = path + this.file;

    // Add the directory
    try {
      await RNFetchBlob.fs.mkdir(path, { NSURLIsExcludedFromBackupKey: true });
    } catch (e) {
      console.log(`directory is created ${path}`)
    }
    // Fetch the file
    let added;

    if (uri.indexOf("file://") > -1) {
      // Copy file in release
      added = RNFetchBlob.fs.exists(dest).then((e) => {
        if (!e) {
          return RNFetchBlob.fs.cp(uri, dest);
        }
      });
    } else {
      // Download for development
      added = RNFetchBlob
        .config({
          fileCache : true,
        })
        .fetch('GET', uri)
        .then((res) => {
          return RNFetchBlob.fs.mv(res.path(), dest);
        })
    }

    added.then(() => {
      // Create a StaticServer at port 3030
      this.server = new StaticServer(this.port, this.root, {localOnly: true});

      this.server.start().then((origin) => {
        this.setState({origin});
      });
    }).catch((err) => {
      console.log(err);
      RNFetchBlob.fs.exists(dest).then((e) => {
        if (e) {
          console.log('start')
          this.server = new StaticServer(this.port, this.root, {localOnly: true});

          this.server.start().then((origin) => {
            console.log(origin)
            this.setState({origin});
          }).catch((e) => {
            console.log(e);
          });
        } else {
          console.error("File doesn't exist")
        }
      }).catch((e) => {
        console.log(e)
      })
    })

  }

  componentWillUnmount() {
    if (this.server) {
      this.server.kill();
    }
  }

  render() {

    if (!this.state.origin) {
      return (
        <View style={styles.container}>
          <Text>Loading...</Text>
        </View>
      );
    }

    return (
      <WebView
        source={{uri: `${this.state.origin}/${this.file}`}}
        style={styles.webview}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  webview: {
    marginTop: 20,
    flex: 1,
  }
});
