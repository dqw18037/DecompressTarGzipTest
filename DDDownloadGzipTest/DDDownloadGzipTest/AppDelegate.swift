//
//  AppDelegate.swift
//  DDDownloadGzipTest
///Users/dqw/Desktop/WebResource
//  Created by dqw on 16/10/18.
//  Copyright © 2016年 ByteDance. All rights reserved.
//

import UIKit
import Alamofire
import tarkit
import NVHTarGzip

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UISplitViewControllerDelegate {

    var window: UIWindow?


    func application(application: UIApplication, didFinishLaunchingWithOptions launchOptions: [NSObject: AnyObject]?) -> Bool {
        // Override point for customization after application launch.
        let splitViewController = self.window!.rootViewController as! UISplitViewController
        let navigationController = splitViewController.viewControllers[splitViewController.viewControllers.count-1] as! UINavigationController
        navigationController.topViewController!.navigationItem.leftBarButtonItem = splitViewController.displayModeButtonItem()
        splitViewController.delegate = self
//        test()
//        printFileNames()

//        decompressTest()
//        gzipTest()
//        printFileNames()
        printNew(true)

//        decompressTest()
        tartkitTarTest()
//        NVHTest()
//        NVHTarTest()
        printNew(false)

//        printFileNames()

        return true
    }
    
    private func NVHTest() {
        let fromPath = NSBundle.mainBundle().pathForResource("WebResource.tar.gz", ofType: nil)
//        let toPath = NSBundle.mainBundle().bundlePath.stringByAppendingString("/DecompressDir")
                let toPath = NSSearchPathForDirectoriesInDomains(NSSearchPathDirectory.DocumentDirectory, NSSearchPathDomainMask.UserDomainMask, true)[0] + "/DecompressDir"
        NVHTarGzip.sharedInstance().unTarGzipFileAtPath(fromPath, toPath: toPath) { (error) in
//            print(error)
        }
        
    }
    
    private func printNew(delete: Bool) {
        let toPath = NSSearchPathForDirectoriesInDomains(NSSearchPathDirectory.DocumentDirectory, NSSearchPathDomainMask.UserDomainMask, true)[0] + "/DecompressDir"
        
        if delete {
            do {
                try NSFileManager.defaultManager().removeItemAtPath(toPath)
            }catch {
                
            }
            
            do {
                try NSFileManager.defaultManager().createDirectoryAtPath(toPath, withIntermediateDirectories: true, attributes: nil)
            } catch {
                
            }
        }
        
        do {
            let fileNames = try  NSFileManager.defaultManager().contentsOfDirectoryAtPath(toPath)
            print(fileNames)
            
        } catch {
            
        }
    }
    
    private func NVHTarTest() {
        let fromPath = NSBundle.mainBundle().pathForResource("WebResource.tar", ofType: nil)
//        let toPath = NSBundle.mainBundle().bundlePath.stringByAppendingString("/DecompressDir")
//        let topath = NSSearchPathForDirectoriesInDomains(NSSearchPathDirectory.NSDocumentDirectory, .NSUserDomainMask, YES)[0]
        let toPath = NSSearchPathForDirectoriesInDomains(NSSearchPathDirectory.DocumentDirectory, NSSearchPathDomainMask.UserDomainMask, true)[0] + "/DecompressDir"
        
        NVHTarGzip.sharedInstance().unTarFileAtPath(fromPath, toPath: toPath) { (error) in
            if let error = error {
                print(error)
 
            }
        }
    }
    
    private func tartkitTarTest() {
        let fromPath = NSBundle.mainBundle().pathForResource("WebResource.tar", ofType: nil)
        let toPath = NSSearchPathForDirectoriesInDomains(NSSearchPathDirectory.DocumentDirectory, NSSearchPathDomainMask.UserDomainMask, true)[0] + "/DecompressDir"
        do {
            try DCTar.untarFileAtPath(fromPath, toPath: toPath)
        } catch {
            print(error)
        }
    }
    
    private func gzipTest() {
        let fromPath = NSBundle.mainBundle().pathForResource("WebResource.tar.gz", ofType: nil)
        let toPath = NSBundle.mainBundle().bundlePath.stringByAppendingString("/WebResource.tar")
        do {
            try DCTar.gzipDecompress(fromPath, toPath: toPath)
        } catch {
            print(error)
        }
        
    }
    
    
    
    private func decompressTest() {
        
        
        let fromPath = NSBundle.mainBundle().pathForResource("WebResource.tar.gz", ofType: nil)
//        let toPath = NSBundle.mainBundle().bundlePath + "/DecompressDir"
        let toPath = NSSearchPathForDirectoriesInDomains(NSSearchPathDirectory.DocumentDirectory, NSSearchPathDomainMask.UserDomainMask, true)[0] + "/DecompressDir"

        do {
            try   DCTar.decompressFileAtPath(fromPath, toPath: toPath)

        } catch {
            print(error)
        }
        
        
    }
    
    private func printFileNames() {
        let path = NSBundle.mainBundle().bundlePath
        do {
            let fileNames = try  NSFileManager.defaultManager().contentsOfDirectoryAtPath(path)
            print(fileNames)
            
        } catch {
            
        }
    }
    
    
//    private func test() {
//        WebResourceManager.sharedManager().downloadTest()
//    }

    func applicationWillResignActive(application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(application: UIApplication) {
        // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    // MARK: - Split view

    func splitViewController(splitViewController: UISplitViewController, collapseSecondaryViewController secondaryViewController:UIViewController, ontoPrimaryViewController primaryViewController:UIViewController) -> Bool {
        guard let secondaryAsNavController = secondaryViewController as? UINavigationController else { return false }
        guard let topAsDetailController = secondaryAsNavController.topViewController as? DetailViewController else { return false }
        if topAsDetailController.detailItem == nil {
            // Return true to indicate that we have handled the collapse by doing nothing; the secondary controller will be discarded.
            return true
        }
        return false
    }

}

