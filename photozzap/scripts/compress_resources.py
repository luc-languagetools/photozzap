
from pyramid.path import AssetResolver
from slimit import minify
import photozzap.staticresources

def minify_javascripts():
    a = AssetResolver('photozzap')
    javascript_codes = []
    for javascript_resource in photozzap.staticresources.javascript_files:
        resolver = a.resolve(javascript_resource)
        full_path = resolver.abspath()
        print("opening %s" % full_path)
        javascript_code = open(full_path, 'r').read()
        javascript_codes.append(javascript_code)

    # minify
    # open output file
    resolver = a.resolve(photozzap.staticresources.combined_javascript_file)
    output_path = resolver.abspath()
  
    output_file = open(output_path, "w")
    output_file.write("\n".join(javascript_codes))
    output_file.close()    
    
    print("wrote combined js code to %s" % output_path)

if __name__ == "__main__":
    #print(photozzap.staticresources.javascript_files)
    minify_javascripts()