"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    WORK_ITEM_TOKEN = process.env.SLACK_WORK_TOKEN;

exports.execute = (req, res) => {

    if (req.body.token != WORK_ITEM_TOKEN) {
        res.send(req.body.token + " != " + WORK_ITEM_TOKEN);
        return;
    }

    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId),
        q = "SELECT Id, Name, agf__Status__c FROM agf__ADM_Work__c WHERE Name LIKE '%" + req.body.text + "%' LIMIT 1";

    force.query(oauthObj, q)
        .then(data => {
            let workItems = JSON.parse(data).records;
            if (workItems && workItems.length>0) {
                let attachments = [];
                workItems.forEach(function(workItem) {
                    let fields = [];
                    fields.push({title: "Name", value: workItem.Name, short:true});
                    fields.push({title: "Status", value: workItem.agf__Status__c, short:true});
                    fields.push({title: "Open in Salesforce:", value: oauthObj.instance_url + "/" + workItem.Id, short:false});
                    attachments.push({color: "#A094ED", fields: fields});
                });
                res.json({text: "Work Items matching '" + req.body.text + "':", attachments: attachments});
            } else {
                res.send("No records");
            }
        })
        .catch(error => {
            if (error.code == 401) {
                res.send(`Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            } else {
                res.send("An error as occurred");
            }
        });
};