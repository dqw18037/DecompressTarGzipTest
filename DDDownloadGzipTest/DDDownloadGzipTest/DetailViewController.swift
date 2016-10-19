//
//  DetailViewController.swift
//  DDDownloadGzipTest
//
//  Created by dqw on 16/10/18.
//  Copyright © 2016年 ByteDance. All rights reserved.
//

import UIKit
import tarkit

class DetailViewController: UIViewController {

    @IBOutlet weak var detailDescriptionLabel: UILabel!


    var detailItem: AnyObject? {
        didSet {
            // Update the view.
            self.configureView()
        }
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        super.touchesBegan(touches, withEvent: event)
        printFileNames()
        decompressTest()
        printFileNames()
    }
    
    
    private func decompressTest() {
        
        
        let fromPath = NSBundle.mainBundle().pathForResource("WebResource.tar", ofType: nil)
        let toPath = NSBundle.mainBundle().bundlePath
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

    func configureView() {
        // Update the user interface for the detail item.
        if let detail = self.detailItem {
            if let label = self.detailDescriptionLabel {
                label.text = detail.description
            }
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.
        self.configureView()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }


}

