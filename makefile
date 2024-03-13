docker:
	docker build -t pixelchat-message-api .

# setup-kubernetes:
# 	eval $(minikube docker-env)

build-kubernetes: setup-kubernetes
	docker build -t pixelchat-message-api .