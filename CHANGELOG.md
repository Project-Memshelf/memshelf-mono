#  (2025-09-05)


### Bug Fixes

* added await server.stop() before exiting to ensure all requests are completed ([1e1f99c](https://github.com/Project-Memshelf/memshelf-mono/commit/1e1f99cfb01f4c64a8cd0a8883005db414820d9f))
* fixed docker container restarts ([8523d7b](https://github.com/Project-Memshelf/memshelf-mono/commit/8523d7bbe4c060e6deb2e276beffb4811dc17038))
* fixed health check script for mariadb docker file ([199d6d2](https://github.com/Project-Memshelf/memshelf-mono/commit/199d6d2583ebf115772c476bacb9f919ca60c9bd))


### Features

* added dev tooling ([ac46403](https://github.com/Project-Memshelf/memshelf-mono/commit/ac4640325cd5c764ec386d1e7857256a47efa968))
* added docker compose for dev env ([5dfd2a6](https://github.com/Project-Memshelf/memshelf-mono/commit/5dfd2a6dc8860c895cb04da252a58374185ec992))
* added ts & js aware paths and added TypeOrm Pino Logger ([f2f3a40](https://github.com/Project-Memshelf/memshelf-mono/commit/f2f3a407906b094acfcef0fdbf71bca5150af47f))
* **api:** implemented production-ready API server with comprehensive middleware ([03087a2](https://github.com/Project-Memshelf/memshelf-mono/commit/03087a251f27fc97dac6b7aba9ef0bae6c3bde0e))
* create basic cli app ([8c0b122](https://github.com/Project-Memshelf/memshelf-mono/commit/8c0b1221161c20710bcb56c364fd7aaccc6faf87))
* **create-turbo:** apply official-starter transform ([c522f7b](https://github.com/Project-Memshelf/memshelf-mono/commit/c522f7b7505d683415c4e84cdb55858158550f2f))
* **create-turbo:** apply package-manager transform ([400af46](https://github.com/Project-Memshelf/memshelf-mono/commit/400af46397988f55237d68d05438e4e3d4785818))
* **create-turbo:** create with-shell-commands ([8669fc0](https://github.com/Project-Memshelf/memshelf-mono/commit/8669fc0cfe0c386ea19c27209ab89c42f97155ca))
* created generic api server ([9036922](https://github.com/Project-Memshelf/memshelf-mono/commit/903692264d811d78ec20e651ca940fd4b1902b53))
* created UsersDbService class ([69fa9e0](https://github.com/Project-Memshelf/memshelf-mono/commit/69fa9e0c6857167588076ad69e0287aae7986f20))
* **docker:** added MongoDB service and Mongo Express GUI for queue system ([c954f54](https://github.com/Project-Memshelf/memshelf-mono/commit/c954f54b32aca0f1daa2432b4875a5e79cec6822))
* migrated shared-core package ([29e5e00](https://github.com/Project-Memshelf/memshelf-mono/commit/29e5e00d692adbe3bdcfdb056b1090def36ce5bd))
* migrated shared-services package ([8b86071](https://github.com/Project-Memshelf/memshelf-mono/commit/8b860713655a70db489e0eaa703323945a1228a0))
* migrated TypeOrm Naming strategy package ([80b5e85](https://github.com/Project-Memshelf/memshelf-mono/commit/80b5e85b657ad78c4d536ee4a1f114854af44908))
* migrated typescript package ([dc2a076](https://github.com/Project-Memshelf/memshelf-mono/commit/dc2a07608bd81a7c2c6b54656c80021cedcda62c))
* **queues:** added connection safety and refactored code generation ([0b471b4](https://github.com/Project-Memshelf/memshelf-mono/commit/0b471b4583bb82f3a9bc716f7e9ab80c6c657798))
* **queues:** added logging support, container integration, and workers app ([4b1f843](https://github.com/Project-Memshelf/memshelf-mono/commit/4b1f843ce043de397f7d66b167f6baeadbc729ec))
* **queues:** implemented type-safe job queue system with Agenda and automatic code generation ([4dec236](https://github.com/Project-Memshelf/memshelf-mono/commit/4dec236f5fb3de304e487f31e8f28791c66e8989))
* **shared-core:** added queue configuration support and improved schema consistency ([a3550db](https://github.com/Project-Memshelf/memshelf-mono/commit/a3550db094e6daf536982d90146c9c4fdb768a70))
* **shared-core:** enhanced configuration parsing with safety improvements ([5f35d10](https://github.com/Project-Memshelf/memshelf-mono/commit/5f35d10099593e8452168b72ad76381b0d89e75b))
* **shared-core:** extended API server configuration with advanced options ([a34200f](https://github.com/Project-Memshelf/memshelf-mono/commit/a34200f3ce4ef3c92fda47c4caed2885e0b2f2f3))



