# Radar Documentation

Welcome to the comprehensive documentation for the Radar platform - an AI-powered opinion mapping system that tracks and analyzes AI perspectives on various topics over time.

## 📚 Documentation Structure

This repository follows a domain-agnostic structure optimized for AI tools and human navigation:

### [🏗️ Architecture](./architecture/)
System design, architectural decisions, and technical patterns
- **[decisions/](./architecture/decisions/)** - Architecture Decision Records (ADRs)
- **[diagrams/](./architecture/diagrams/)** - System diagrams and flowcharts
- **[patterns/](./architecture/patterns/)** - Design patterns and best practices

### [💻 Development](./development/)
Everything needed for development work
- **[setup/](./development/setup/)** - Environment setup and bootstrapping
  - [bootstrap.md](./development/setup/bootstrap.md) - Quick start guide
  - [environment.md](./development/setup/environment.md) - Environment configuration
  - [inngest.md](./development/setup/inngest.md) - Background job setup
- **[workflow/](./development/workflow/)** - Development processes
- **[guidelines/](./development/guidelines/)** - Coding standards and conventions
- **[testing/](./development/testing/)** - Testing strategies and guides

### [🚀 Operations](./operations/)
Deployment, monitoring, and maintenance
- **[deployment/](./operations/deployment/)** - Deployment procedures
- **[monitoring/](./operations/monitoring/)** - Observability and alerting
- **[maintenance/](./operations/maintenance/)** - Maintenance procedures
- **[security/](./operations/security/)** - Security guidelines

### [📖 Reference](./reference/)
Technical references and API documentation
- **[api/](./reference/api/)** - API specifications
- **[database/](./reference/database/)** - Database schemas
- **[integrations/](./reference/integrations/)** - Third-party integrations
- **[glossary/](./reference/glossary/)** - Technical terms and concepts

### [📋 Guides](./guides/)
Step-by-step guides for different audiences
- **[user/](./guides/user/)** - End-user guides
- **[developer/](./guides/developer/)** - Developer tutorials
- **[contributor/](./guides/contributor/)** - Contribution guidelines
- **[admin/](./guides/admin/)** - Administration guides

### [📅 Planning](./planning/)
Project planning and roadmap
- **[roadmap/](./planning/roadmap/)** - Product roadmap
- **[features/](./planning/features/)** - Feature specifications
- **[milestones/](./planning/milestones/)** - Project milestones
- **[retrospectives/](./planning/retrospectives/)** - Sprint retrospectives

### [📏 Standards](./standards/)
Coding and documentation standards
- **[code/](./standards/code/)** - Code style guides
- **[documentation/](./standards/documentation/)** - Documentation standards
- **[design/](./standards/design/)** - Design system guidelines
- **[security/](./standards/security/)** - Security standards

### [🛠️ Implementation](./implementation/)
Detailed implementation documentation
- **[web/](./implementation/web/)** - Next.js web application (radar-xyz)
- **[ios/](./implementation/ios/)** - iOS application (radar-apple)
- **[ai/](./implementation/ai/)** - AI service (radar-ai)

### [🎨 Design](./design/)
Design system and UI guidelines
- [tailwind-v4-spacing.md](./design/tailwind-v4-spacing.md) - Tailwind CSS v4 spacing system

## 🚀 Quick Links

### For Developers
- [Development Bootstrap Guide](./development/setup/bootstrap.md)
- [Web Implementation Summary](./implementation/web/implementation-summary.md)
- [iOS Implementation Guide](./implementation/ios/README.md)
- [Quick Reference](./implementation/web/quick-reference.md)

### For Contributors
- [Contribution Guidelines](./guides/contributor/)
- [Code Standards](./standards/code/)
- [Documentation Standards](./standards/documentation/)

### For Operations
- [Deployment Guide](./operations/deployment/)
- [Security Guidelines](./operations/security/)
- [Monitoring Setup](./operations/monitoring/)

## 📂 Repository Overview

The Radar platform consists of three main repositories:

1. **[radar-xyz](https://github.com/lnittman/radar-xyz)** - Web application (Next.js 15.3, Turborepo)
2. **[radar-ai](https://github.com/lnittman/radar-ai)** - AI service (Mastra framework)
3. **[radar-apple](https://github.com/lnittman/radar-apple)** - iOS application (SwiftUI)

## 🤖 AI-Optimized Documentation

This documentation structure is optimized for AI tools like Claude:

- **Consistent Naming**: Single-word, lowercase directory names
- **Clear Hierarchy**: Domain-agnostic structure reusable across projects
- **Self-Documenting**: Each section has clear purpose and README files
- **Cross-Referenced**: Links between related documentation
- **Searchable**: Descriptive filenames and organized structure

## 📝 Documentation Standards

All documentation follows these principles:

1. **Clarity**: Write for both humans and AI assistants
2. **Completeness**: Include all necessary context
3. **Currency**: Keep documentation up-to-date with code
4. **Consistency**: Follow established patterns and formats
5. **Accessibility**: Use clear language and provide examples

## 🔄 Maintenance

Documentation is maintained alongside code development:

- **Before Implementation**: Update planning docs
- **During Implementation**: Update implementation guides
- **After Implementation**: Update reference docs
- **Regular Reviews**: Quarterly documentation audits

## 📞 Getting Help

- **Development Issues**: See [troubleshooting guides](./guides/developer/)
- **Documentation Issues**: File an issue in this repository
- **General Questions**: Check the [glossary](./reference/glossary/) first

---

*Last Updated: December 2024*
*Maintained by the Radar development team*