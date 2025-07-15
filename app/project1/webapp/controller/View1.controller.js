sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/Label",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/MessageBox"
], function (Controller, JSONModel, Dialog, Table, Column, Label, ColumnListItem, Text, Button, MessageBox) {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit: function () {
            const oViewModel = new JSONModel({
                selectedStatusId: "",
                selectedStatusName: "",
                selectedStatusLabel: "",
                Candidates: []
            });
            this.getView().setModel(oViewModel, "viewModel");
        },

        onStatusValueHelp: function () {
            if (!this._oStatusDialog) {
                const oTable = new Table({
                    id: this.createId("StatusTable"),
                    mode: "SingleSelectMaster",
                    growing: true,
                    growingThreshold: 20,
                    columns: [
                        new Column({ header: new Label({ text: "ID" }) }),
                        new Column({ header: new Label({ text: "Name" }) }),
                        new Column({ header: new Label({ text: "Label" }) })
                    ],
                    items: {
                        path: "/JobApplicationStatusesWithLabels",
                        template: new ColumnListItem({
                            type: "Active",
                            cells: [
                                new Text({ text: "{appStatusId}" }),
                                new Text({ text: "{appStatusName}" }),
                                new Text({ text: "{statusLabel}" })
                            ]
                        })
                    }
                });

                this._oStatusDialog = new Dialog({
                    title: "Select Job Application Status",
                    content: [oTable],
                    beginButton: new Button({
                        text: "OK",
                        press: async () => {
                            const oSelectedItem = this.byId("StatusTable").getSelectedItem();
                            if (oSelectedItem) {
                                const oContext = oSelectedItem.getBindingContext();
                                const oData = oContext.getObject();

                                const viewModel = this.getView().getModel("viewModel");
                                viewModel.setProperty("/selectedStatusId", oData.appStatusId);
                                viewModel.setProperty("/selectedStatusName", oData.appStatusName);
                                viewModel.setProperty("/selectedStatusLabel", oData.statusLabel);

                                this.byId("statusInput").setValue(oData.statusLabel);

                                await this._loadCandidates(oData.appStatusId);

                                this._oStatusDialog.close();
                            } else {
                                MessageBox.warning("Please select a status.");
                            }
                        }
                    }),
                    endButton: new Button({
                        text: "Cancel",
                        press: () => {
                            this._oStatusDialog.close();
                        }
                    })
                });

                const oODataModel = this.getOwnerComponent().getModel();
                this._oStatusDialog.setModel(oODataModel);
                this.getView().addDependent(this._oStatusDialog);
            }

            this._oStatusDialog.open();
        },

        _loadCandidates: async function (statusId) {
            const oModel = this.getView().getModel(); // Should be OData V4 model
            const viewModel = this.getView().getModel("viewModel");
        
            try {
                const oListBinding = oModel.bindList("/CandidatesByStatus", undefined, undefined, [
                    new sap.ui.model.Filter("appStatusId", "EQ", statusId)
                ]);
                const aContexts = await oListBinding.requestContexts();
                const aCandidates = aContexts.map(ctx => ctx.getObject());
        
                if (aCandidates.length) {
                    viewModel.setProperty("/Candidates", aCandidates);
                } else {
                    viewModel.setProperty("/Candidates", []);
                    sap.m.MessageBox.information("No candidates found for the selected status.");
                }
            } catch (err) {
                console.error("Failed to load candidates:", err);
                sap.m.MessageBox.error("Failed to load candidates.");
            }
        }
        
        
    });
});
