docker exec -it document-iq-platform-kafka-1 kafka-topics --create --topic document.ingestion.requested --bootstrap-server localhost:29092 --partitions 3 --replication-factor 1
docker exec -it document-iq-platform-kafka-1 kafka-topics --create --topic document.layout.requested --bootstrap-server localhost:29092 --partitions 3 --replication-factor 1
docker exec -it document-iq-platform-kafka-1 kafka-topics --create --topic document.processing.completed --bootstrap-server localhost:29092 --partitions 3 --replication-factor 1
docker exec -it document-iq-platform-kafka-1 kafka-topics --create --topic document.dlq --bootstrap-server localhost:29092 --partitions 3 --replication-factor 1
