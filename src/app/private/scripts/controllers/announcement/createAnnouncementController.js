'use strict';

angular.module('playerApp')
  .controller('createAnnouncementCtrl', ['$rootScope', '$scope', '$timeout', '$state', '$stateParams', 'config', 'toasterService',
    'permissionsService', 'dashboardService',
    function($rootScope, $scope, $timeout, $state, $stateParams, config, toasterService, permissionsService, dashboardService) {

      // Initialize variables
      var createAnn = this;

        // TODO - use api to get values
        createAnn.org = ['Org 1', 'Org 2', 'Org 3'];
        createAnn.announcementType = ['Type 1', 'Type 2', 'Type 3'];
        createAnn.desableBtn   = 'disabled';
        createAnn.showStepOne  = true;
        createAnn.showStepTwo  = false;
        createAnn.showStepThree= false;
        $scope.showUrlField    = false;
        $scope.repeatableWebLinks = [];
        createAnn.stepNumber   = 1;

        // TODO - show announcement preview
        createAnn.previewData = {"announcementId":"2344-1234-1234-12312","sourceId":"some-organisation-id","createdBy":"Creator1","createdOn":"2017-10-24","type":"announcement","links":["https://linksToOtheresources.com"],"title":"Monthy Status","description":"some description","target":["teachers"],"attachments":[{"title":"circular.pdf","downloadURL":"https://linktoattachment","mimetype":"application/pdf"}]};

        // Initialize modal
        createAnn.initializeModal = function(){
        	$timeout(function () {
          		$('#announcementType').dropdown();
          		$('#orgDropdown').dropdown();
	        }, 100);
        }

        createAnn.createAnnouncement = function (){
          $('#createAnnouncementModal').modal({
          	closable: false,
          	onHide: function () {
          		// TODO - Show confirmation before closing modal
          		createAnn.refreshFormValues();
          	}
          }).modal('show');
        }

        $scope.addNewChoice = function() {
          var newItemNo = $scope.repeatableWebLinks.length+1;
          $scope.repeatableWebLinks.push({'id':'choice'+newItemNo});
          $scope.showUrlField = true;
        };

        $scope.removeChoice = function(index) {
          //var lastItem = $scope.repeatableWebLinks.length-1;
          $scope.repeatableWebLinks.splice(index, 1);
          if ($scope.repeatableWebLinks.length == '0'){
          	$scope.showUrlField = false;
          }
        };

        // Function to post form data
        createAnn.selectRecipients = function(){
        	createAnn.showStepOne = false;
        	createAnn.showStepTwo = true;
        	createAnn.stepNumber = 2;
        	return;
        }

        // Function to detect input box change event
        createAnn.detectChange = function (){
        	createAnn.enableRecepientBtn();
    	}

    	// Function to detect dropdwon value change event
    	createAnn.detectDropdownChange = function (){
    		createAnn.enableRecepientBtn();
    	}

    	// Function to track back button change
    	createAnn.previousStep = function(item){
    		var step = $('#annBackBtn').attr('data-current-state');

    		switch (step) {
		        case "2":
		        	createAnn.showStepOne   = true;
    				createAnn.showStepThree = false;
		        	createAnn.showStepTwo   = false;
		        	createAnn.showStepFour  = false;
		        	createAnn.stepNumber    = 1
		            break;
		        case "3":
    				createAnn.showStepOne   = false;
    				createAnn.showStepTwo   = true;
    				createAnn.showStepThree = false;
		        	createAnn.showStepFour  = false;
    				createAnn.stepNumber    = 2;
		            break;

		        case "4":
    				createAnn.showStepOne   = false;
    				createAnn.showStepTwo   = false;
    				createAnn.showStepThree = true;
    				createAnn.showStepFour  = false;
    				createAnn.stepNumber    = 3;
		            break;
		        default:

		    }
    	}

    	// Function to preview announcement
    	createAnn.previewAnn = function(){
    		createAnn.showStepOne   = false;
			createAnn.showStepThree = false;
			createAnn.showStepTwo   = false;
			createAnn.showStepFour  = true;
			createAnn.stepNumber    = 4;
    	}

    	// Function to confirm recipients
    	createAnn.confirmRecipients = function(){
    		createAnn.showStepOne = false;
    		createAnn.showStepTwo = false;
    		createAnn.showStepThree = true;
    		createAnn.stepNumber = 3;
    	}

    	// Function to enable / disable RecepientBtn
    	createAnn.enableRecepientBtn = function() {
	        if (createAnn.data.title && createAnn.data.from
	        	&& createAnn.data.announcementType &&
	        	(createAnn.data.description || createAnn.attachment.length)){
	        	createAnn.desableBtn = '';
	        } else {
	        	createAnn.desableBtn = 'disabled';
	        }
	    }

	    createAnn.refreshFormValues = function(){
	    	createAnn.showStepThree = false;
			createAnn.showStepTwo   = false;
			createAnn.showStepFour  = false;
			createAnn.showStepOne   = true;
			createAnn.stepNumber    = 1;
			createAnn.desableBtn    = 'disabled';
			$('#announcementType').dropdown('restore defaults');
			$('#orgDropdown').dropdown('restore defaults');
			$('#createAnnouncementModal').modal('refresh');
			$('#announcementForm').form('reset');
			createAnn.data = {};
	    }

	    createAnn.saveAnnouncement = function(){
	    	createAnn.refreshFormValues();
	    	$('#announcementSuccessModal').modal({
	          	closable: false
	        }).modal('show');
	    }

		createAnn.attachment = [];
		createAnn.index = 0;
        createAnn.initializeFileUploader = function () {
	        $timeout(function () {
	            createAnn.manualUploader = new qq.FineUploader({
	                element: document.getElementById('fine-uploader-manual-trigger'),
	                template: 'qq-template-manual-trigger',
	                request: {
	                    endpoint: 'http://www.mocky.io/v2/59ef30b72e0000001d1c5e09'
	                },
	                autoUpload: true,
	                debug: true,
	                validation: {
	                    sizeLimit: config.MaxFileSizeToUpload,
	                    allowedExtensions: config.AllowedFileExtension
	                },
	                messages: {
	                     sizeError: '{file} ' +
	                     $rootScope.messages.imsg.m0006 + ' ' +
	                                             config.MaxFileSizeToUpload / (1000 * 1024) + ' MB.'
	                },
	                failedUploadTextDisplay: {
        				mode: 'default',
        				responseProperty: 'error'
    				},
    				showMessage: function(message) {
        				toasterService.error(message);
    				},
	                callbacks: {
	                    onComplete: function (id, name, responseJSON, xhr) {
	                    	// TODO - push attachement api success response
	                        createAnn.attachment.push('A', 'B');
	                        createAnn.enableRecepientBtn();
	                    },
	                    onSubmitted: function (id, name) {
	                        createAnn.uploadedFileId = id;
	                        createAnn.selectedFileName = name;
	                        createAnn.selectedFile = this.getFile(id);
	                        createAnn.getSelectedFileMime(name);
	                        document.getElementById('hide-section-with-button')
	                                                .style.display = 'none';
	                    },
	                    onCancel: function () {
	                        document.getElementById('hide-section-with-button')
	                                                .style.display = 'block';
	                    },
	                    onError: function(id, name, errorReason, xhrOrXdr) {
				            toasterService.error(qq.format("Error on file number {} - {}.  Reason: {}", id, name, errorReason));
				        },
	                }
	            });

	            window.cancelUploadFile = function () {
	                document.getElementById('hide-section-with-button').style.display = 'block';
	            };
	        }, 300);
	    };

        createAnn.getSelectedFileMime = function (fileName) {
            var array = fileName.split('.');
            var ext = array.reverse()[0];
            createAnn.data.mimeType = createAnn.objMimeType[ext];
            createAnn.selectedFileMimeType = createAnn.objMimeType[ext];
        };
    }
  ])
