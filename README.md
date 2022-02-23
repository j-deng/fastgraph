# fastgraph

fastgraph is a fullstack framework for building graphql api and admin system.

> Still in development!

## How it works?

### fastgraph-node

- Model design and migration - by [prisma](https://github.com/prisma/prisma)
- Resource design with a set of typescript decorators, similar to [type-graphql](https://github.com/MichalLytek/type-graphql)
- Decorators are also available in prisma schema - as triple comment
- Automatically translate resource to graphql schema and resolvers
- Start server with [apollo-server](https://github.com/apollographql/apollo-server)
- Resource definition metadata is designed to be used in both server and client side
- [dataloader](https://github.com/graphql/dataloader) to optimize queries

### fastgraph-vue

- Powered by [vue3](https://github.com/vuejs/core), [ant-design-vue](https://next.antdv.com/docs/vue/introduce), [apollo-client](https://v4.apollo.vuejs.org/) and [echarts](https://echarts.apache.org)
- A set of vue antd components that render resource and provide common CRUD oprations by passing resource metadata from server
- Support for custom form components and field render

## Documentation

### Getting started

Please fork [fastgraph-startup](https://github.com/j-deng/fastgraph-startup) and have a try.

### Tutorials

- [Model design with prisma](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model)
- [Decorators]()
- [Validation]()
- [Permission check]()
- [Middleware]()
- [Chart options]()
- [Client-side customization]()

## TODO

- [ ] File upload
- [ ] Resource Export & Import
- [ ] Common used form components
