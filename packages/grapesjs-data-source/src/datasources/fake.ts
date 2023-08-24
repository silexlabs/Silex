import { Connector, DataSourceOptions, Item, ItemId, ItemNonScalar, ItemScalar, Type, TypeId, TypeNonScalar } from "..";

class FakeItemNonScalar implements ItemNonScalar {
  id: ItemId
  name: string
  scalar = false
  constructor(public type: TypeNonScalar, private data: any) {
    this.id = data.id
    this.name = data.firstName ?? data.title
  }
  field(name: string): Item {
    const type = this.type.fields().find(type => type.id === name)
    if(!type) throw new Error(`Field ${name} not found`)
    switch(type.scalar) {
      case true:
        return new FakeItemScalar(type, name, this.data[name])
      case false:
        return new FakeItemNonScalar(type, this.data[name])
      default:
        throw new Error(`Field ${name} has invalid scalar value`)
    }
  }
}
class FakeItemScalar implements ItemScalar {
  scalar = true
  constructor(public type: Type, public name: string, public value: any) {
    this.value = value
  }
}
type FakeItem = FakeItemScalar | FakeItemNonScalar

export default class implements Connector {
  private posts: any = null
  private users: any = null

  constructor(private options: DataSourceOptions) {}

  async init(): Promise<void> {
    const postResponse = await fetch('https://dummyjson.com/posts?limit=10')
    this.posts = (await postResponse.json()).posts
    const userResponse = await fetch('https://dummyjson.com/users?limit=10')
    this.users = (await userResponse.json()).users
  }

  async getTypes(): Promise<Type[]> {
    return [this.getUserField(), this.getPostField()]
  }
  getUserField(): Type {
    return {
      id: 'user',
      name: 'User',
      scalar: false,
      fields: () => [{
        id: 'email',
        name: 'Email',
        scalar: true,
      }, {
        id: 'name',
        name: 'Name',
        scalar: true,
      }, this.getPostField()],
    }
  }
  getPostField(): Type {
    return {
      id: 'post',
      name: 'Post',
      scalar: false,
      fields: () => [{
        id: 'date',
        name: 'Date',
        scalar: true,
      }, {
        id: 'title',
        name: 'Title',
        scalar: true,
      }, {
        id: 'content',
        name: 'Content',
        scalar: true,
      }, this.getUserField()],
    }
  }
  async getType(id: TypeId): Promise<Type> {
    const types = await this.getTypes()
    const type = types.find(type => type.id === id)
    if(!type) throw new Error(`Type ${id} not found`)
    return type
  }
  async getItems(type: Type): Promise<Item[]> {
    switch(type.id) {
      case 'user':
        return this.users.map((user: any) => new FakeItemNonScalar(type as TypeNonScalar, user))
      case 'post':
        return this.posts.map((post: any) => new FakeItemNonScalar(type as TypeNonScalar, post))
      default:
        throw new Error(`Type ${type.id} not found`)
    }
  }
  async getItem(type: Type,id: ItemId): Promise<FakeItem> {
    switch(type.id) {
      case 'user':
        return new FakeItemNonScalar(type as TypeNonScalar, this.users.find((user: any) => user.id === id))
      case 'post':
        return new FakeItemNonScalar(type as TypeNonScalar, this.posts.find((post: any) => post.id === id))
      default:
        throw new Error(`Type ${type.id} not found`)
    }
  }
}