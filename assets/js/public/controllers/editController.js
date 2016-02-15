angular.module('zoomableApp').controller('editController', function($scope, $stateParams, servicesAPI){

	// VARIABLES
	$scope.defaultImagePath = 'images/bunny.png';
	$scope.video_id = $stateParams.videoId;

	/* Get video object by video id */
	servicesAPI.getOne($scope.video_id)
	.success(function(data) {
		$scope.video = data;
	})
	.error(function(data) {
		console.log('Error: ' + data);
	});

	/* Copy embed link to system clipboard */
	$scope.copyEmbedLink = function(link) {
		console.log(link);
		// TO BE IMPLEMENTED
	}

	/* Update video privacy field */
	$scope.updatePrivacy = function(privacy) {
		$scope.video.privacy = privacy;
	}

});