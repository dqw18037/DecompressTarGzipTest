//
//  WebResourceManager.swift
//  NewsMaster
//
//  Created by dqw on 16/10/17.
//  Copyright © 2016年 NewsMaster. All rights reserved.
//

import UIKit
import Alamofire
import tarkit

//
//typealias UpdateInfoHandler = (filesMd5: String?, URLString: String?, error: NewsMaster.Error?) -> Void
typealias WebResourcesHandler = (error: NSError?) -> Void

 class WebResourceManager {
    
    private var webResourceNames: [String]?
    private let fileStampKey = "WebResourcesFileStamp"
    private let memoryCache = NSCache()

    private let fileManager = NSFileManager.defaultManager()
    private static let sharedInstance = WebResourceManager()
    class func sharedManager() -> WebResourceManager {
        return sharedInstance
    }
    
//    private func updateWebResourcesIfNeed(){
//        
//        let resourceHandler: WebResourcesHandler = {[weak self] error in
//            guard let strongSelf = self else {return}
//            if error == nil {
//              let success = strongSelf.replaceWebResources()
//                if success {
//                    strongSelf.clearTemporaryDirectory()
//                } else {
//                    strongSelf.clearTemporaryDirectory()
//                    // FIXME: 如果失败，也删除了重新下载，暂时这样定
//                }
//            }
//        }
//        
//        requestUpdateInfo {[weak self] (filesMd5, URLString, error) in
//            guard let strongSelf = self else {return}
//            if let fileStamp = filesMd5 {
//                if strongSelf.shouldUpdate(fileStamp), let URLString = URLString {
//                    strongSelf.requestWebResources(URLString, resourcessHandler: resourceHandler)
//                }
//            }
//        }
//    }
}

// 读取js资源
extension WebResourceManager {
    func resourceNamed(named: String) -> String? {
        let result = memoryCache.objectForKey(named)
        if let resource = result as? String {
            return resource
        } else {
            if let path = NSBundle.mainBundle().pathForResource(named, ofType: "") {
                if let result = try? NSString(contentsOfFile: path, encoding: NSUTF8StringEncoding) {
                    memoryCache.setObject(result, forKey: named)
                    return result as String
                }
            }
        }
        return nil
    }
    
    func inlineJSWithFileName(name: String) -> String? {
        if let JSContent = WebResourceManager.sharedManager().resourceNamed(name) {
            let JSScript = [
                "<script type=\"text/javascript\">",
                JSContent,
                "</script>"
            ]
            return JSScript.joinWithSeparator("\n")
        }
        return nil
    }
    
    func inlineCSSWithFileName(fileName: String) -> String? {
        if let CSSContent = WebResourceManager.sharedManager().resourceNamed(fileName) {
            return "<style>\(CSSContent)</style>"
        }
        return nil
    }
    
    func JSResources(resources: [String]) -> String? {
        let key = resources.joinWithSeparator("-")
        if let results = memoryCache.objectForKey(key) as? String {
            return results
        }
        
        var results = [String]()
        var validResource = [String]()
        for resource in resources {
            if let js = inlineJSWithFileName(resource) {
                results.append(js)
                validResource.append(resource)
            }
        }
        if results.isEmpty {
            return nil
        }
        let scripts = results.joinWithSeparator("\n")
        memoryCache.setObject(scripts, forKey: validResource.joinWithSeparator("-"))
        return scripts
    }
    
    func downloadTest() {
        createTemporaryDirectoryIfNeed()
//        printDirectory(webResourceDirectoryPath())
        printDirectory(temporaryDirectoryPath())
        requestWebResources("http://s.ipstatp.com/test/ios/WebResource.tar.gz") {[weak self] (error) in
            if error == nil {
                if let fileNames = self?.temporaryFiles() {
                    self!.printDirectory(self!.temporaryDirectoryPath())
                    self!.decompressFile()
                    self!.printDirectory(self!.temporaryDirectoryPath())

                }
            }
        }
    }
    
    private func printDirectory(path:String) {
        do {
//            print(path)
            let files = try NSFileManager.defaultManager().contentsOfDirectoryAtPath(path)
           try files.forEach({ (fileName) in
                let path = temporaryFilePath(fileName)
               let attr = try fileManager.attributesOfItemAtPath(path)
                let size = attr["NSFileSize"]
                let data = try NSData(contentsOfFile: path, options: .DataReadingUncached)
            
                print(" \(fileName) = \(size) = \(data.length)")
//            let string = try String(contentsOfFile: path)
//            print(string)
            })
        } catch {
            
        }
    }
    
    private func decompressFile() {
        let tempPath = temporaryFilePath("gzip.tar.gz")
        let toPath = temporaryDirectoryPath()
        do {
            try  DCTar.decompressFileAtPath(tempPath, toPath: toPath)
        } catch {
            print(error)
        }
        
    }
    
    
}

// 网络请求
extension WebResourceManager {
    
    
    private func requestWebResources(URLString: String, resourcessHandler: WebResourcesHandler) {
        let temporaryFilePath = temporaryDirectoryPath() + "/gzip.tar.gz"
//        let headers = ["User-Agent": NewsMaster.getWebViewUserAgent(), "referer": ""]
        Alamofire.download(.GET, URLString, headers: nil, destination: {(temporaryURL, response) in
        return NSURL(fileURLWithPath: temporaryFilePath)
        }).response { (request, response, _, error) in
            if let error = error {
                resourcessHandler(error: error)
            } else {
                resourcessHandler(error: nil)
            }
        }
    }
    
//    private func requestUpdateInfo(infoHandler: UpdateInfoHandler) {
//        NewsMaster.Network.request("").pack()?.nm_responseJSON({[weak self] (_, _, result, error) in
//            guard let _ = self else {
//                let error = NewsMaster.Error(userInfo: nil)
//                infoHandler(filesMd5: nil, URLString: nil, error: error)
//                return
//            }
//            if let error = error {
//                infoHandler(filesMd5: nil, URLString: nil, error: error)
//                return
//            }
////            if let filesMd5 = "", URLString = "" {
//                let filesMd5 = "", URLString = ""
//                infoHandler(filesMd5: filesMd5, URLString: URLString, error: nil)
////            }
//        })
//    }
}

// 文件版本信息
extension WebResourceManager {
    
    private func fileStamp() -> String? {
        var fileStamp: String? = nil
        fileStamp = NSUserDefaults.standardUserDefaults().stringForKey(fileStampKey)
        return fileStamp
    }
    
    private func shouldUpdate(newFileStamp: String) -> Bool {
        var result = false
        if let fileStamp = fileStamp() {
            result = newFileStamp == fileStamp
        }
        return result
    }
    
    private func setFileStamp(fileStamp: String) {
        NSUserDefaults.standardUserDefaults().setObject(fileStamp, forKey: fileStampKey)
    }
}

// 文件操作
// FIXME: 要把文件先备份，如果有任何一个替换失败，则返回退回到原来的状态。
extension WebResourceManager {
    private func replaceWebResources() -> Bool {
        var result = false
        if let tempFiles = temporaryFiles() {
           result = replaceWebResourceFiles(tempFiles)
        }
        return result
    }
    
    private func replaceWebResourceFiles(files: [String : String]) -> Bool {
        var result = true
        let fileNames = files.keys
        for fileName in fileNames {
            let sourcePath = files[fileName]
            let toPath = filePath(fileName)
            if containsFile(fileName) {
               let flag = replaceFile(sourcePath, toPath: toPath)
                if !flag {
                    result = false
                    break
                }
            } else {
                let flag = moveFile(sourcePath, toPath: toPath)
                if !flag {
                    result = false
                    break
                }
            }
        }
        return result
    }
    
    private func containsFile(fileName: String!) -> Bool {
        var result = false
        guard let webResourceNames = webResourceNames else {
            return result
        }
       result = webResourceNames.contains(fileName) // TODO: 方法适配
        return result
    }
    
    private func getWebResourceNames() -> [String]? {
        var fileNames: [String] = [String]()
        let path = webResourceDirectoryPath()
        do {
            fileNames = try fileManager.contentsOfDirectoryAtPath(path)
        } catch {}
        
        
        
        if fileNames.count > 0 {
            return fileNames
        } else {
            return nil
        }
    }
    

    
    private func temporaryFiles() -> [String : String]? {
        var fileNames: [String]?
        var filePaths = [String : String]()
        
        do {
            fileNames = try fileManager.contentsOfDirectoryAtPath(temporaryDirectoryPath())
        } catch {
            
        }
        if let fileNames = fileNames {
            for fileName in fileNames {
                let filePath = temporaryFilePath(fileName)
                filePaths[fileName] = filePath
            }
        }
        if filePaths.count > 0 {
            return filePaths
        } else {
            return nil
        }
    }

    private func moveFile(sourcePath: String?, toPath: String?) -> Bool {
    
        var result = false
    
        return result
    }
    
    private func replaceFile(sourcePath: String?, toPath: String?) -> Bool {
        var result = false
        guard let sourcePath = sourcePath, toPath = toPath else {
            return result
        }
        result = true
        
        return result
    }
    
    
    // Directory
    private func createTemporaryDirectoryIfNeed() -> Bool {
        var result = true
        let path = temporaryDirectoryPath()
        if !fileManager.fileExistsAtPath(path) {
            do {
                try fileManager.createDirectoryAtPath(path, withIntermediateDirectories: true, attributes: nil)
            } catch {
                result = false
            }
        }
        return result
    }
    
    private func clearTemporaryDirectory() -> Bool {
        var result = false
        let path = temporaryDirectoryPath()
        if fileManager.fileExistsAtPath(path) {
            do {
                try fileManager.removeItemAtPath(path)
                result = createTemporaryDirectoryIfNeed()
            } catch {
            }
        } else {
           result = createTemporaryDirectoryIfNeed()
        }
        return result
    }
    
    private func filePath(fileName: String!) -> String? {
        return webResourceDirectoryPath() + "/\(fileName)"
    }
    
    private func temporaryFilePath(fileName: String!) -> String {
        return temporaryDirectoryPath() + "/\(fileName)"
    }
    
    private func webResourceDirectoryPath() -> String {
        return NSBundle.mainBundle().bundlePath + "/WebResource"
    }

    private func temporaryDirectoryPath() -> String {
        return webResourceDirectoryPath() + "/TemporaryResource"
    }
}
