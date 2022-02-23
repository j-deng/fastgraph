enum TokenTypes {
  AT = '@',
  COLON = ':',
  COMMA = ',',
  LPAREN = '(',
  RPAREN = ')',
  LF = '\n',
  ID = 'ID',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  STRING = 'STRING',
  SINGLE_QUOTATION = "'",
  DOUBLE_QUOTATION = '"',
  EOF = 'EOF'
}

enum AST {
  block,
  statementList,
  statement,
  params,
  keywords,
  keyword,
  variable
}

export interface ASTNode {
  type: AST
  [key: string]: any
}

export type Variable = string | boolean | number | null

interface Token {
  type: TokenTypes
  value: Variable
}

type TokenType = keyof typeof TokenTypes

const _reverseTokenTypes: Record<string, any> = {}
Object.keys(TokenTypes).map((k: any) => {
  _reverseTokenTypes[TokenTypes[k as TokenType] as string] = k
})

const reverseMappingTokens = (char: string) =>
  _reverseTokenTypes[char] as TokenTypes

const reservedTokens: string[] = [
  TokenTypes.AT,
  TokenTypes.COLON,
  TokenTypes.COMMA,
  TokenTypes.LPAREN,
  TokenTypes.RPAREN,
  TokenTypes.LF,
  TokenTypes.SINGLE_QUOTATION,
  TokenTypes.DOUBLE_QUOTATION
]

// ID is a string starts with alphabet or `_` and match `\w`
const isID = (str: string): boolean => /^[_a-zA-Z][\w]*/.test(str)

const isSpace = (str: string): boolean => str === ' '

export class Lexer {
  text: string
  pos: number
  escapeChar: boolean

  constructor(text: string) {
    this.text = text
    this.pos = 0
    this.escapeChar = false
  }

  get currentChar() {
    return this.text[this.pos] || undefined
  }

  peek() {
    return this.text[this.pos + 1]
  }

  advance() {
    if (this.pos < this.text.length) {
      this.pos += 1
    }
  }

  skipWhitespace() {
    if (this.currentChar && isSpace(this.currentChar)) {
      this.advance()
    }
  }

  /**
   * Take a string like token.
   *
   * Token with sigle or double quotation is as String,
   * otherwise may check it's a number or boolean or ID first.
   *
   * @param quotation is SINGLE_QUOTATION or DOUBLE_QUOTATION or undefined
   * @returns
   */
  takeVal(quotation?: '"' | "'" | undefined): Token {
    let result = ''

    if (quotation) {
      while (
        this.currentChar &&
        (this.currentChar !== quotation || this.escapeChar)
      ) {
        if (this.currentChar === '\\') {
          this.escapeChar = !this.escapeChar
        } else {
          this.escapeChar = false
        }
        if (this.currentChar !== '\\' || this.peek() !== quotation) {
          result += this.currentChar
        }
        this.advance()
      }
    } else {
      while (
        this.currentChar &&
        !reservedTokens.includes(this.currentChar) &&
        !isSpace(this.currentChar)
      ) {
        result += this.currentChar
        this.advance()
      }
    }

    if (!quotation) {
      // @ts-ignore
      if (!isNaN(result)) {
        return { type: TokenTypes.NUMBER, value: Number(result) }
      }
      if (result === 'true' || result === 'false') {
        return { type: TokenTypes.BOOLEAN, value: result === 'true' }
      }
      if (result === 'null') {
        return { type: TokenTypes.NULL, value: null }
      }
      if (isID(result)) {
        return { type: TokenTypes.ID, value: result }
      }
    }

    return { type: TokenTypes.STRING, value: result }
  }

  nextToken(): Token {
    while (this.currentChar) {
      if (isSpace(this.currentChar)) {
        this.skipWhitespace()
        continue
      }

      if (
        this.currentChar === TokenTypes.SINGLE_QUOTATION ||
        this.currentChar === TokenTypes.DOUBLE_QUOTATION
      ) {
        const quotation = this.currentChar
        this.advance()
        const result = this.takeVal(quotation)
        if (this.currentChar != quotation) {
          throw new Error('Unclosed quotation.')
        }
        this.advance()
        return result
      }

      if (reservedTokens.includes(this.currentChar)) {
        const result = {
          type: reverseMappingTokens(this.currentChar),
          value: this.currentChar
        }
        this.advance()
        return result
      }

      return this.takeVal()
    }

    return {
      type: TokenTypes.EOF,
      value: null
    }
  }
}

export class Parser {
  lexer: Lexer
  currentToken: Token | undefined

  constructor(private text: string) {
    this.lexer = new Lexer(this.text)
    this.currentToken = undefined
  }

  get _nextChar() {
    return this.lexer.currentChar
  }

  nextToken(): Token {
    return this.lexer.nextToken()
  }

  block(): ASTNode {
    return {
      type: AST.block,
      statementList: this.statementList()
    }
  }

  statementList(): ASTNode {
    const children = []
    while (true) {
      if (!this._nextChar) break
      if (this._nextChar === TokenTypes.LF) {
        this.take(TokenTypes.LF)
        continue
      }
      children.push(this.statement())
    }
    return {
      type: AST.statementList,
      children: children
    }
  }

  statement(): ASTNode {
    this.take(TokenTypes.AT)
    const decorator = this.take(TokenTypes.ID).value
    const params = this.params()
    return {
      type: AST.statement,
      decorator,
      params
    }
  }

  /**
   * For params, brackets are optional, single line multi-statements
   * is supported if wrapping with brackets.
   *
   * variable
   * | keywords
   * | variable COMMA keywords
   *
   * @returns ASTNode
   */
  params(): ASTNode {
    let value: Token | undefined
    let keywords: ASTNode = {
      type: AST.keywords,
      children: []
    }

    // LPAREN and RPAREN is optional
    const lparen = this._nextChar === TokenTypes.LPAREN
    if (lparen) {
      this.take(TokenTypes.LPAREN)
    }

    if (
      this._nextChar &&
      this._nextChar !== TokenTypes.LF &&
      (!lparen || this._nextChar !== TokenTypes.RPAREN)
    ) {
      this.currentToken = this.nextToken()
      // With value, keywords
      if (
        [TokenTypes.STRING, TokenTypes.ID].includes(this.currentToken.type) &&
        this._nextChar === TokenTypes.COMMA
      ) {
        value = this.currentToken
        keywords = this.keywords()
      }
      // Only value
      else if (!this._nextChar || this._nextChar === TokenTypes.LF) {
        value = this.currentToken
      }
      // Only keywords
      else {
        const key = this.currentToken
        const keyword = this.keyword(key)
        keywords = this.keywords()
        keywords = { ...keywords, children: [keyword, ...keywords.children] }
      }
    }

    if (this._nextChar) {
      this.take(lparen ? TokenTypes.RPAREN : TokenTypes.LF)
    }

    return {
      type: AST.params,
      value,
      keywords
    }
  }

  keywords(): ASTNode {
    const keywords = []
    while (this._nextChar === TokenTypes.COMMA) {
      this.take(TokenTypes.COMMA)
      keywords.push(this.keyword())
    }
    return {
      type: AST.keywords,
      children: keywords
    }
  }

  keyword(key?: Token): ASTNode {
    if (!key) {
      key = this.take(TokenTypes.ID)
    }
    this.take(TokenTypes.COLON)
    const value = this.variable()
    return {
      type: AST.keyword,
      key: key.value,
      value
    }
  }

  variable(): ASTNode {
    const want = [
      TokenTypes.NUMBER,
      TokenTypes.BOOLEAN,
      TokenTypes.ID,
      TokenTypes.STRING
    ]
    const token = this.nextToken()
    if (!want.includes(token.type)) {
      throw new Error(`Not valid variable -> ${token.value}(${token.type})`)
    }
    return {
      type: AST.variable,
      token
    }
  }

  take(tokenType: string): Token {
    const want = reverseMappingTokens(tokenType)
    this.currentToken = this.nextToken()
    if (!this.currentToken || this.currentToken.type !== want) {
      throw new Error(
        `Unexcept token, want ${want}, ${this.currentToken?.type} taked`
      )
    }
    return this.currentToken
  }

  /**
   * AST
   *
   * block : statement_list
   * statement_list : statement
   *                | statement LF statement_list
   * statement : AT ID (LPAREN params RPAREN)?
   * params : (variable COMMA)* keywords
   * keywords : keyword (COMMA keyword)*
   * keyword : ID COLON variable
   * variable : NUMBER
   *          | BOOLEAN
   *          | ID
   *          | STRING
   *          | NULL
   */
  parse(): ASTNode {
    return this.block()
  }
}

export interface StatementResult {
  decorator: string
  params: {
    value: Variable
    keywords: Record<string, Variable>
  }
}

export class Interpreter {
  constructor(private tree: ASTNode) {}

  visitBlock(node: ASTNode): StatementResult[] {
    return this.visitStatementList(node.statementList)
  }

  visitStatementList(node: ASTNode): StatementResult[] {
    return (node.children as ASTNode[]).map((item) => this.visitStatement(item))
  }

  visitStatement(node: ASTNode): StatementResult {
    const { decorator, params } = node
    return {
      decorator,
      params: this.visitParams(params)
    }
  }

  visitParams(node: ASTNode): {
    value: Variable
    keywords: Record<string, Variable>
  } {
    const { value, keywords } = node
    return {
      value: value?.value,
      keywords: this.visitKeywords(keywords)
    }
  }

  visitKeywords(node: ASTNode): Record<string, Variable> {
    return Object.fromEntries(
      (node.children as ASTNode[]).map((item) => this.visitKeyword(item))
    )
  }

  visitKeyword(node: ASTNode): [string, Variable] {
    const { key, value } = node
    return [key, this.visitVariable(value)]
  }

  visitVariable(node: ASTNode): Variable {
    return (node.token as Token).value
  }

  interpret(): StatementResult[] {
    return this.visitBlock(this.tree)
  }
}
